import csv
import hashlib
import json
import os
import re
from collections.abc import Iterable

from sqlalchemy.orm import Session

from backend.models import (
    Vocabulary,
    VocabularyExample,
    VocabularyGermanDetail,
    VocabularyMeaning,
    VocabularySRSState,
    VocabularyTag,
    VocabularyTagLink,
)


def clean(value):
    if value in (None, "", "nan", "None"):
        return None
    return str(value).strip()


def split_multivalue(value: str | None) -> list[str]:
    if not value:
        return []
    parts = re.split(r"[;,/]|、|\n", value)
    return [part.strip() for part in parts if part and part.strip()]


def detect_part_of_speech(category: str | None, lemma: str, variations: str | None) -> str | None:
    category_text = (category or "").lower()
    variations_text = (variations or "").lower()
    if "verb" in category_text or "動詞" in category_text:
        return "verb"
    if "noun" in category_text or "名詞" in category_text:
        return "noun"
    if "adjective" in category_text or "形容詞" in category_text:
        return "adjective"
    # Noun: raw_word has article prefix
    if re.match(r"^(der|die|das)\s+", lemma.lower()):
        return "noun"
    # Noun: variations field starts with article (e.g. "die Bronze (Sg.)")
    if re.match(r"^(der|die|das)\s+", (variations or "").strip(), re.IGNORECASE):
        return "noun"
    if "sich " in lemma.lower() or "+" in variations_text:
        return "verb"
    return None


def extract_article_and_lemma(
    raw_word: str, part_of_speech: str | None, variations: str | None = None
) -> tuple[str, str | None]:
    # Try raw_word first (e.g. "die Bronze" in the word column)
    match = re.match(r"^(der|die|das)\s+(.+)$", raw_word.strip(), re.IGNORECASE)
    if part_of_speech == "noun" and match:
        return match.group(2).strip(), match.group(1).lower()
    # Fall back to variations field (e.g. "die Bronze (Sg.)")
    if part_of_speech == "noun" and variations:
        var_match = re.match(r"^(der|die|das)\s+", variations.strip(), re.IGNORECASE)
        if var_match:
            return raw_word.strip(), var_match.group(1).lower()
    return raw_word.strip(), None


def parse_german_detail(
    raw_word: str,
    part_of_speech: str | None,
    variations: str | None,
    sub_category: str | None,
) -> dict:
    lemma, article = extract_article_and_lemma(raw_word, part_of_speech, variations)
    pieces = [piece.strip() for piece in (variations or "").split(",") if piece.strip()]
    detail = {
        "article": article,
        "plural_form": None,
        "transitivity": None,
        "present_3sg": None,
        "preterite": None,
        "partizip_ii": None,
        "auxiliary": None,
        "is_strong_verb": False,
        "comparative": None,
        "superlative": None,
        "verb_patterns": [],
    }

    lower_variations = (variations or "").lower()
    if part_of_speech == "noun":
        # Parse from variations: "(der|die|das) Lemma[, plural_suffix][ (Sg.|Pl.)]"
        var_match = re.match(
            r"^(?:der|die|das)\s+\S+\s*(?:,\s*([^()\n]+?))?(?:\s*\(([^)]+)\))?\s*$",
            (variations or "").strip(),
            re.IGNORECASE,
        )
        if var_match:
            plural_suffix = (var_match.group(1) or "").strip()
            marker = (var_match.group(2) or "").strip().lower()
            if "sg" in marker:
                detail["plural_form"] = "(Sg.)"
            elif "pl" in marker:
                detail["plural_form"] = "(Pl.)"
            elif plural_suffix:
                detail["plural_form"] = plural_suffix
        elif pieces and not re.match(r"^(der|die|das)\s+", pieces[0], re.IGNORECASE):
            # Raw comma-split fallback, only if first piece is not an article phrase
            detail["plural_form"] = pieces[0]
    elif part_of_speech == "verb":
        if "及物" in (sub_category or ""):
            detail["transitivity"] = "transitive"
        elif "不及物" in (sub_category or ""):
            detail["transitivity"] = "intransitive"

        if len(pieces) >= 1:
            detail["present_3sg"] = pieces[0]
        if len(pieces) >= 2:
            detail["preterite"] = pieces[1]
        if len(pieces) >= 3:
            detail["partizip_ii"] = pieces[2]
        if re.search(r"\b(ist|hat)\b", lower_variations):
            detail["auxiliary"] = "sein" if "ist" in lower_variations else "haben"
        detail["is_strong_verb"] = bool(
            re.search(r"\b(strong|stark)\b", lower_variations) or len(pieces) >= 3
        )
        detail["verb_patterns"] = [
            item for item in split_multivalue(variations) if "+" in item or item.lower().startswith("sich ")
        ]
    elif part_of_speech == "adjective":
        if len(pieces) >= 1:
            detail["comparative"] = pieces[0]
        if len(pieces) >= 2:
            detail["superlative"] = pieces[1]

    return {"lemma": lemma, **detail}


def build_source_ref(raw_word: str, category: str | None, sub_category: str | None, variations: str | None) -> str:
    joined = "||".join([raw_word.strip(), category or "", sub_category or "", variations or ""])
    return hashlib.sha1(joined.encode("utf-8")).hexdigest()


def load_review_decisions(review_csv_path: str | None) -> dict[int, list[dict]]:
    if not review_csv_path or not os.path.exists(review_csv_path):
        return {}

    decisions: dict[int, list[dict]] = {}
    with open(review_csv_path, "r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        fieldnames = reader.fieldnames or []
        if "row_number" not in fieldnames:
            print(
                "Review CSV is using a legacy format without 'row_number'; "
                "ignoring manual review decisions for this run."
            )
            return {}
        for row in reader:
            row_number_raw = row.get("row_number")
            if not row_number_raw:
                continue
            row_number = int(row_number_raw)
            decisions.setdefault(row_number, []).append(row)
    return decisions


def apply_review_decisions(row: dict, decisions: list[dict]) -> tuple[list[str], list[str]]:
    context_tags: list[str] = []
    notes: list[str] = []

    for decision in decisions:
        status = (decision.get("review_status") or "").strip().lower()
        if status not in {"", "approved", "accepted", "predicted"}:
            continue
        target = (decision.get("predicted_target_field") or "").strip()
        value = clean(decision.get("proposed_value")) or clean(decision.get("original_value"))
        if not value:
            continue
        if target == "context_tag":
            context_tags.append(value)
        elif target == "meaning_zh":
            if not row.get("中文釋義"):
                row["中文釋義"] = value
            else:
                notes.append(f"review:{value}")
        elif target == "notes":
            notes.append(value)

    return context_tags, notes


def build_anomaly_rows(records: Iterable[dict]) -> list[dict]:
    anomaly_rows: list[dict] = []
    for row in records:
        row_number = int(row.get("row_number", 0))
        for column_name in ("Unnamed: 7", "Unnamed: 9"):
            original_value = clean(row.get(column_name))
            if not original_value:
                continue

            predicted_target_field = "context_tag"
            confidence = 0.78
            proposed_value = original_value

            if re.search(r"[\u4e00-\u9fff]", original_value):
                predicted_target_field = "meaning_zh" if not clean(row.get("中文釋義")) else "notes"
                confidence = 0.87 if predicted_target_field == "meaning_zh" else 0.64

            anomaly_rows.append(
                {
                    "row_number": row_number,
                    "word": clean(row.get("單字")) or "",
                    "column_name": column_name,
                    "original_value": original_value,
                    "predicted_target_field": predicted_target_field,
                    "proposed_value": proposed_value,
                    "confidence": confidence,
                    "review_status": "",
                    "review_note": "",
                    "existing_sub_category": clean(row.get("次類別")) or "",
                    "existing_meaning_zh": clean(row.get("中文釋義")) or "",
                }
            )
    return anomaly_rows


def import_records(
    db: Session,
    records: list[dict],
    review_decisions: dict[int, list[dict]] | None = None,
    source_name: str = "excel_import",
) -> dict[str, int]:
    review_decisions = review_decisions or {}
    created = 0
    updated = 0

    tag_cache: dict[str, VocabularyTag] = {
        f"{tag.tag_type}:{tag.name}": tag for tag in db.query(VocabularyTag).all()
    }

    for row in records:
        raw_word = clean(row.get("單字"))
        if not raw_word:
            continue

        category = clean(row.get("類別"))
        sub_category = clean(row.get("次類別"))
        variations = clean(row.get("單字及詞形變化"))
        source_ref = build_source_ref(raw_word, category, sub_category, variations)
        part_of_speech = detect_part_of_speech(category, raw_word, variations)
        detail = parse_german_detail(raw_word, part_of_speech, variations, sub_category)

        context_tags = []
        notes = []
        if clean(row.get("Unnamed: 7")) and not re.search(r"[\u4e00-\u9fff]", clean(row.get("Unnamed: 7")) or ""):
            context_tags.append(clean(row.get("Unnamed: 7")))
        if clean(row.get("Unnamed: 9")) and not re.search(r"[\u4e00-\u9fff]", clean(row.get("Unnamed: 9")) or ""):
            context_tags.append(clean(row.get("Unnamed: 9")))
        decision_tags, decision_notes = apply_review_decisions(
            row, review_decisions.get(int(row.get("row_number", 0)), [])
        )
        context_tags.extend(decision_tags)
        notes.extend(decision_notes)

        zh_meaning = clean(row.get("中文釋義"))
        en_meaning = clean(row.get("英文釋義"))
        tw_meaning = clean(row.get("台文釋義"))

        if clean(row.get("Unnamed: 9")) and re.search(r"[\u4e00-\u9fff]", clean(row.get("Unnamed: 9")) or ""):
            shifted = clean(row.get("Unnamed: 9"))
            if not zh_meaning:
                zh_meaning = shifted
            elif shifted not in zh_meaning:
                notes.append(f"shifted_meaning:{shifted}")

        note_text = "; ".join(dict.fromkeys([item for item in notes if item]))
        vocabulary = (
            db.query(Vocabulary)
            .filter(Vocabulary.source == source_name, Vocabulary.source_ref == source_ref)
            .first()
        )

        is_new = vocabulary is None
        if is_new:
            vocabulary = Vocabulary(
                lemma=detail["lemma"],
                part_of_speech=part_of_speech,
                category=category,
                sub_category=sub_category,
                source=source_name,
                source_ref=source_ref,
                status="active",
                notes=note_text or None,
            )
            db.add(vocabulary)
            db.flush()
        else:
            vocabulary.lemma = detail["lemma"]
            vocabulary.part_of_speech = part_of_speech
            vocabulary.category = category
            vocabulary.sub_category = sub_category
            vocabulary.status = "active"
            vocabulary.notes = note_text or None
            vocabulary.meanings.clear()
            vocabulary.examples.clear()
            vocabulary.tags.clear()
            db.flush()

        german_detail = vocabulary.german_detail or VocabularyGermanDetail(vocabulary_id=vocabulary.id)
        german_detail.article = detail["article"]
        german_detail.plural_form = detail["plural_form"]
        german_detail.transitivity = detail["transitivity"]
        german_detail.present_3sg = detail["present_3sg"]
        german_detail.preterite = detail["preterite"]
        german_detail.partizip_ii = detail["partizip_ii"]
        german_detail.auxiliary = detail["auxiliary"]
        german_detail.is_strong_verb = detail["is_strong_verb"]
        german_detail.comparative = detail["comparative"]
        german_detail.superlative = detail["superlative"]
        german_detail.verb_patterns = " | ".join(detail["verb_patterns"]) if detail["verb_patterns"] else None
        vocabulary.german_detail = german_detail

        meanings = [("zh", zh_meaning), ("en", en_meaning), ("nan", tw_meaning)]
        for index, (language_code, text) in enumerate(meanings):
            if text:
                vocabulary.meanings.append(
                    VocabularyMeaning(language_code=language_code, text=text, position=index)
                )

        if variations:
            vocabulary.examples.append(
                VocabularyExample(
                    language_code="de",
                    text=f"{detail['lemma']} ({variations})",
                    translation=zh_meaning,
                    source="import",
                    position=0,
                )
            )

        # Build tag list: (name, tag_type) tuples - category, sub_category, context
        all_tags: list[tuple[str, str]] = []
        if category:
            all_tags.append((category, "category"))
        if sub_category:
            all_tags.append((sub_category, "sub_category"))
        for tag_name in context_tags:
            if tag_name:
                all_tags.append((tag_name, "context"))

        for tag_name, tag_type in dict.fromkeys(all_tags):
            cache_key = f"{tag_type}:{tag_name}"
            tag = tag_cache.get(cache_key)
            if not tag:
                tag = VocabularyTag(name=tag_name, tag_type=tag_type)
                db.add(tag)
                db.flush()
                tag_cache[cache_key] = tag
            vocabulary.tags.append(VocabularyTagLink(tag_id=tag.id))

        if not vocabulary.srs_state:
            vocabulary.srs_state = VocabularySRSState()

        created += 1 if is_new else 0
        updated += 0 if is_new else 1

    db.commit()
    return {"created": created, "updated": updated}


def load_json_records(path: str) -> list[dict]:
    with open(path, "r", encoding="utf-8") as handle:
        return json.load(handle)
