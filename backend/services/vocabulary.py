from datetime import datetime, timedelta, timezone

from sqlalchemy import func, or_
from sqlalchemy.orm import Session, joinedload

from backend.models import (
    ReviewEvent,
    StudySession,
    Vocabulary,
    VocabularyMeaning,
    VocabularySRSState,
    VocabularyTagLink,
    VocabularyTag,
)
from backend.schemas import (
    DictionaryLinksDTO,
    DueReviewResponse,
    GermanDetailDTO,
    PaginatedVocabularyResponse,
    ReviewCardDTO,
    ReviewEventCreate,
    ReviewEventResultDTO,
    SRSStateDTO,
    StatsOverviewDTO,
    StudySessionDTO,
    VocabularyDetailDTO,
    VocabularyListItemDTO,
)
from backend.services.dictionaries import build_dictionary_links
from backend.services.srs import SRSStateSnapshot, apply_sm2_like_review


SORT_FIELDS = {
    "lemma": Vocabulary.lemma,
    "category": Vocabulary.category,
    "part_of_speech": Vocabulary.part_of_speech,
    "due_at": VocabularySRSState.due_at,
}


def utcnow() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


def _base_query(db: Session):
    return (
        db.query(Vocabulary)
        .options(
            joinedload(Vocabulary.meanings),
            joinedload(Vocabulary.examples),
            joinedload(Vocabulary.tags).joinedload(VocabularyTagLink.tag),
            joinedload(Vocabulary.german_detail),
            joinedload(Vocabulary.srs_state),
        )
        .outerjoin(VocabularySRSState, VocabularySRSState.vocabulary_id == Vocabulary.id)
    )


def _serialize_srs_state(state: VocabularySRSState | None) -> SRSStateDTO | None:
    if not state:
        return None
    return SRSStateDTO(
        ease_factor=state.ease_factor,
        interval_days=state.interval_days,
        repetitions=state.repetitions,
        due_at=state.due_at,
        last_reviewed_at=state.last_reviewed_at,
    )


def _serialize_german_detail(vocabulary: Vocabulary) -> GermanDetailDTO | None:
    detail = vocabulary.german_detail
    if not detail:
        return None
    verb_patterns = []
    if detail.verb_patterns:
        verb_patterns = [item.strip() for item in detail.verb_patterns.split("|") if item.strip()]
    return GermanDetailDTO(
        article=detail.article,
        plural_form=detail.plural_form,
        transitivity=detail.transitivity,
        present_3sg=detail.present_3sg,
        preterite=detail.preterite,
        partizip_ii=detail.partizip_ii,
        auxiliary=detail.auxiliary,
        is_strong_verb=detail.is_strong_verb,
        comparative=detail.comparative,
        superlative=detail.superlative,
        verb_patterns=verb_patterns,
    )


def serialize_vocabulary_list_item(vocabulary: Vocabulary) -> VocabularyListItemDTO:
    return VocabularyListItemDTO(
        id=vocabulary.id,
        lemma=vocabulary.lemma,
        part_of_speech=vocabulary.part_of_speech,
        category=vocabulary.category,
        sub_category=vocabulary.sub_category,
        status=vocabulary.status,
        tags=[link.tag.name for link in vocabulary.tags],
        meanings=[
            {"language_code": meaning.language_code, "text": meaning.text, "position": meaning.position}
            for meaning in sorted(vocabulary.meanings, key=lambda item: (item.position, item.id))
        ],
        german_detail=_serialize_german_detail(vocabulary),
        srs_state=_serialize_srs_state(vocabulary.srs_state),
    )


def serialize_vocabulary_detail(vocabulary: Vocabulary) -> VocabularyDetailDTO:
    return VocabularyDetailDTO(
        **serialize_vocabulary_list_item(vocabulary).model_dump(),
        source=vocabulary.source,
        notes=vocabulary.notes,
        examples=[
            {
                "language_code": example.language_code,
                "text": example.text,
                "translation": example.translation,
                "source": example.source,
                "position": example.position,
            }
            for example in sorted(vocabulary.examples, key=lambda item: (item.position, item.id))
        ],
        dictionaries=DictionaryLinksDTO(**build_dictionary_links(vocabulary.lemma)),
    )


def list_vocabularies(
    db: Session,
    page: int = 1,
    page_size: int = 25,
    search: str | None = None,
    part_of_speech: str | None = None,
    category: str | None = None,
    tag: str | None = None,
    sort: str = "lemma",
) -> PaginatedVocabularyResponse:
    query = _base_query(db)

    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            or_(
                Vocabulary.lemma.ilike(search_filter),
                Vocabulary.notes.ilike(search_filter),
                Vocabulary.category.ilike(search_filter),
                Vocabulary.sub_category.ilike(search_filter),
                Vocabulary.meanings.any(VocabularyMeaning.text.ilike(search_filter)),
                Vocabulary.tags.any(VocabularyTagLink.tag.has(VocabularyTag.name.ilike(search_filter))),
            )
        )

    if part_of_speech:
        query = query.filter(Vocabulary.part_of_speech == part_of_speech)

    if category:
        query = query.filter(Vocabulary.category == category)

    if tag:
        query = query.join(Vocabulary.tags).join(VocabularyTag).filter(VocabularyTag.name == tag)

    sort_field = SORT_FIELDS.get(sort, Vocabulary.lemma)
    query = query.order_by(sort_field.asc().nullslast(), Vocabulary.lemma.asc())

    total = query.distinct().count()
    offset = max(page - 1, 0) * page_size
    items = query.distinct().offset(offset).limit(page_size).all()

    return PaginatedVocabularyResponse(
        total=total,
        page=page,
        page_size=page_size,
        data=[serialize_vocabulary_list_item(item) for item in items],
    )


def get_vocabulary_detail(db: Session, vocabulary_id: int) -> VocabularyDetailDTO | None:
    vocabulary = _base_query(db).filter(Vocabulary.id == vocabulary_id).first()
    if not vocabulary:
        return None
    return serialize_vocabulary_detail(vocabulary)


def create_due_session(db: Session, limit: int = 20) -> DueReviewResponse:
    now = utcnow()
    cards = (
        _base_query(db)
        .filter(or_(VocabularySRSState.due_at.is_(None), VocabularySRSState.due_at <= now))
        .order_by(VocabularySRSState.due_at.asc().nullsfirst(), Vocabulary.lemma.asc())
        .limit(limit)
        .all()
    )

    session = StudySession(total_cards=len(cards), completed_cards=0)
    db.add(session)
    db.commit()
    db.refresh(session)

    return DueReviewResponse(
        session=StudySessionDTO.model_validate(session, from_attributes=True),
        cards=[ReviewCardDTO(vocabulary=serialize_vocabulary_detail(card)) for card in cards],
    )


def record_review_event(db: Session, payload: ReviewEventCreate) -> ReviewEventResultDTO:
    vocabulary = _base_query(db).filter(Vocabulary.id == payload.vocabulary_id).first()
    if not vocabulary:
        raise LookupError("Vocabulary not found")

    state = vocabulary.srs_state
    if state is None:
        state = VocabularySRSState(vocabulary_id=vocabulary.id, due_at=utcnow())
        db.add(state)
        db.flush()

    before = SRSStateSnapshot(
        ease_factor=state.ease_factor,
        interval_days=state.interval_days,
        repetitions=state.repetitions,
    )
    after = apply_sm2_like_review(before, payload.grade)
    reviewed_at = utcnow()

    state.ease_factor = after.ease_factor
    state.interval_days = after.interval_days
    state.repetitions = after.repetitions
    state.last_reviewed_at = reviewed_at
    state.due_at = reviewed_at + timedelta(days=after.interval_days)

    session = None
    if payload.session_id is not None:
        session = db.query(StudySession).filter(StudySession.id == payload.session_id).first()
        if session:
            session.completed_cards = min(session.total_cards, session.completed_cards + 1)
            if session.completed_cards >= session.total_cards and session.completed_at is None:
                session.completed_at = reviewed_at

    event = ReviewEvent(
        vocabulary_id=vocabulary.id,
        session_id=payload.session_id,
        grade=payload.grade,
        reviewed_at=reviewed_at,
        scheduled_interval_before=before.interval_days,
        scheduled_interval_after=after.interval_days,
        ease_before=before.ease_factor,
        ease_after=after.ease_factor,
    )
    db.add(event)
    db.commit()
    db.refresh(state)
    if session:
        db.refresh(session)

    return ReviewEventResultDTO(
        vocabulary_id=vocabulary.id,
        grade=payload.grade,
        reviewed_at=reviewed_at,
        next_due_at=state.due_at or reviewed_at,
        interval_days=state.interval_days,
        ease_factor=state.ease_factor,
        repetitions=state.repetitions,
        session=StudySessionDTO.model_validate(session, from_attributes=True) if session else None,
    )


def get_overview_stats(db: Session) -> StatsOverviewDTO:
    now = utcnow()
    since = now - timedelta(days=30)

    reviewed_last_30_days = (
        db.query(func.count(ReviewEvent.id)).filter(ReviewEvent.reviewed_at >= since).scalar() or 0
    )
    completed_sessions_last_30_days = (
        db.query(func.count(StudySession.id))
        .filter(StudySession.completed_at.is_not(None), StudySession.completed_at >= since)
        .scalar()
        or 0
    )
    due_cards = (
        db.query(func.count(VocabularySRSState.vocabulary_id))
        .filter(or_(VocabularySRSState.due_at.is_(None), VocabularySRSState.due_at <= now))
        .scalar()
        or 0
    )

    return StatsOverviewDTO(
        reviewed_last_30_days=reviewed_last_30_days,
        completed_sessions_last_30_days=completed_sessions_last_30_days,
        due_cards=due_cards,
    )
