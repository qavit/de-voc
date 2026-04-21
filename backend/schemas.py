from datetime import datetime

from pydantic import BaseModel, Field


class MeaningDTO(BaseModel):
    language_code: str
    text: str
    position: int


class ExampleDTO(BaseModel):
    language_code: str
    text: str
    translation: str | None = None
    source: str
    position: int


class GermanDetailDTO(BaseModel):
    article: str | None = None
    plural_form: str | None = None
    transitivity: str | None = None
    present_3sg: str | None = None
    preterite: str | None = None
    partizip_ii: str | None = None
    auxiliary: str | None = None
    is_strong_verb: bool = False
    comparative: str | None = None
    superlative: str | None = None
    verb_patterns: list[str] = Field(default_factory=list)


class SRSStateDTO(BaseModel):
    ease_factor: float
    interval_days: int
    repetitions: int
    due_at: datetime | None = None
    last_reviewed_at: datetime | None = None


class DictionaryLinksDTO(BaseModel):
    dict_cc: str
    wiktionary: str
    langenscheidt: str


class VocabularyListItemDTO(BaseModel):
    id: int
    lemma: str
    part_of_speech: str | None = None
    category: str | None = None
    sub_category: str | None = None
    status: str
    tags: list[str] = Field(default_factory=list)
    meanings: list[MeaningDTO] = Field(default_factory=list)
    german_detail: GermanDetailDTO | None = None
    srs_state: SRSStateDTO | None = None


class VocabularyDetailDTO(VocabularyListItemDTO):
    source: str
    notes: str | None = None
    examples: list[ExampleDTO] = Field(default_factory=list)
    dictionaries: DictionaryLinksDTO


class PaginatedVocabularyResponse(BaseModel):
    total: int
    page: int
    page_size: int
    data: list[VocabularyListItemDTO]


class StudySessionDTO(BaseModel):
    id: int
    started_at: datetime
    completed_at: datetime | None = None
    total_cards: int
    completed_cards: int


class ReviewCardDTO(BaseModel):
    vocabulary: VocabularyDetailDTO


class DueReviewResponse(BaseModel):
    session: StudySessionDTO
    cards: list[ReviewCardDTO]


class ReviewEventCreate(BaseModel):
    vocabulary_id: int
    grade: int = Field(..., ge=0, le=3)
    session_id: int | None = None


class ReviewEventResultDTO(BaseModel):
    vocabulary_id: int
    grade: int
    reviewed_at: datetime
    next_due_at: datetime
    interval_days: int
    ease_factor: float
    repetitions: int
    session: StudySessionDTO | None = None


class StatsOverviewDTO(BaseModel):
    reviewed_last_30_days: int
    completed_sessions_last_30_days: int
    due_cards: int
