"""
LLM service: composes prompts, calls providers, writes results to DB.
"""
from __future__ import annotations

from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from backend.models import (
    Vocabulary,
    VocabularyExample,
    VocabularyGermanDetail,
)
from backend.services.llm import LLMResult, get_llm_provider
from backend.services.vocabulary import _base_query

# ---------------------------------------------------------------------------
# Response schemas (used as structured output targets)
# ---------------------------------------------------------------------------

class VerbInflectionSchema(BaseModel):
    present_3sg: str | None = Field(None, description="3rd person singular present, e.g. 'läuft'")
    preterite: str | None = Field(None, description="1st person singular preterite, e.g. 'lief'")
    partizip_ii: str | None = Field(None, description="Past participle, e.g. 'gelaufen'")
    auxiliary: str | None = Field(None, description="'haben' or 'sein'")
    is_strong_verb: bool = Field(False, description="True if this is a strong/irregular verb")


class NounDetailSchema(BaseModel):
    article: str | None = Field(None, description="'der', 'die', or 'das'")
    plural_form: str | None = Field(None, description="Plural form of the noun")


class ExampleSentence(BaseModel):
    de: str = Field(..., description="German example sentence")
    zh: str = Field(..., description="Chinese translation")


class ExampleSentencesSchema(BaseModel):
    sentences: list[ExampleSentence] = Field(..., min_length=1, max_length=3)


class ValidationIssue(BaseModel):
    field: str
    message: str


class ValidationResultSchema(BaseModel):
    issues: list[ValidationIssue] = Field(default_factory=list)


# ---------------------------------------------------------------------------
# Service functions
# ---------------------------------------------------------------------------

_SYSTEM_GRAMMAR = "You are a German linguistics assistant. Provide accurate grammatical data."
_SYSTEM_EXAMPLE = "You are a German language teacher. Create natural, B1-B2 level example sentences."
_SYSTEM_VALIDATE = "You are a German linguistics QA checker. Report factual errors in vocabulary data."


async def autofill_german_detail(db: Session, vocabulary_id: int) -> dict:
    vocab: Vocabulary | None = _base_query(db).filter(Vocabulary.id == vocabulary_id).first()
    if not vocab:
        raise LookupError("Vocabulary not found")

    provider = get_llm_provider()
    result: LLMResult

    if vocab.part_of_speech == "verb":
        prompt = (
            f'Fill in the German verb inflection for "{vocab.lemma}". '
            f"Variations hint: {vocab.german_detail.verb_patterns if vocab.german_detail else 'none'}"
        )
        result = await provider.complete_structured(prompt, VerbInflectionSchema, _SYSTEM_GRAMMAR)
        data: VerbInflectionSchema = result.data

        detail = vocab.german_detail or VocabularyGermanDetail(vocabulary_id=vocab.id)
        if data.present_3sg:  detail.present_3sg  = data.present_3sg
        if data.preterite:    detail.preterite     = data.preterite
        if data.partizip_ii:  detail.partizip_ii   = data.partizip_ii
        if data.auxiliary:    detail.auxiliary     = data.auxiliary
        detail.is_strong_verb = data.is_strong_verb
        if not vocab.german_detail:
            db.add(detail)
        updated_fields = data.model_dump(exclude_none=True)

    elif vocab.part_of_speech == "noun":
        prompt = f'For the German noun "{vocab.lemma}", provide article and plural form.'
        result = await provider.complete_structured(prompt, NounDetailSchema, _SYSTEM_GRAMMAR)
        data: NounDetailSchema = result.data

        detail = vocab.german_detail or VocabularyGermanDetail(vocabulary_id=vocab.id)
        if data.article:      detail.article      = data.article
        if data.plural_form:  detail.plural_form  = data.plural_form
        if not vocab.german_detail:
            db.add(detail)
        updated_fields = data.model_dump(exclude_none=True)

    else:
        raise ValueError(f"Auto-fill not supported for part_of_speech={vocab.part_of_speech!r}")

    db.commit()
    return {"updated_fields": updated_fields, "usage": _usage_dict(result)}


async def generate_examples(db: Session, vocabulary_id: int) -> dict:
    vocab: Vocabulary | None = _base_query(db).filter(Vocabulary.id == vocabulary_id).first()
    if not vocab:
        raise LookupError("Vocabulary not found")

    meanings_zh = ", ".join(
        m.text for m in vocab.meanings if m.language_code == "zh"
    ) or "—"

    prompt = (
        f'Create 2 natural German example sentences using "{vocab.lemma}" '
        f"({vocab.part_of_speech or 'word'}, meaning: {meanings_zh}). "
        f"Category context: {vocab.category or 'general'}. "
        f"Provide the Chinese translation in Traditional Chinese (繁體中文)."
    )

    provider = get_llm_provider()
    result = await provider.complete_structured(prompt, ExampleSentencesSchema, _SYSTEM_EXAMPLE)
    data: ExampleSentencesSchema = result.data

    # Remove old LLM examples before adding new ones
    vocab.examples = [e for e in vocab.examples if e.source != "llm"]
    for i, sentence in enumerate(data.sentences):
        example = VocabularyExample(
            vocabulary_id=vocab.id,
            language_code="de",
            text=sentence.de,
            translation=sentence.zh,
            source="llm",
            position=i,
        )
        db.add(example)

    db.commit()
    return {
        "examples": [{"de": s.de, "zh": s.zh} for s in data.sentences],
        "usage": _usage_dict(result),
    }


async def validate_vocabulary(db: Session, vocabulary_id: int) -> dict:
    vocab: Vocabulary | None = _base_query(db).filter(Vocabulary.id == vocabulary_id).first()
    if not vocab:
        raise LookupError("Vocabulary not found")

    detail = vocab.german_detail
    meanings_zh = "; ".join(m.text for m in vocab.meanings if m.language_code == "zh") or "—"

    prompt = (
        f"Review this German vocabulary entry and report any factual errors:\n"
        f"  Lemma: {vocab.lemma}\n"
        f"  Part of speech: {vocab.part_of_speech}\n"
        f"  Article: {detail.article if detail else '—'}\n"
        f"  Plural: {detail.plural_form if detail else '—'}\n"
        f"  Preterite: {detail.preterite if detail else '—'}\n"
        f"  Partizip II: {detail.partizip_ii if detail else '—'}\n"
        f"  Meaning (zh): {meanings_zh}\n"
        f"If no issues, return an empty issues list."
    )

    provider = get_llm_provider()
    result = await provider.complete_structured(prompt, ValidationResultSchema, _SYSTEM_VALIDATE)
    data: ValidationResultSchema = result.data

    return {
        "issues": [i.model_dump() for i in data.issues],
        "usage": _usage_dict(result),
    }


def _usage_dict(result: LLMResult) -> dict:
    u = result.usage
    return {
        "provider": u.provider,
        "model": u.model,
        "input_tokens": u.input_tokens,
        "output_tokens": u.output_tokens,
        "cost_usd": round(u.cost_usd, 6),
    }
