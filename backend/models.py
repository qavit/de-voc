from datetime import UTC, datetime

from sqlalchemy import (
    Boolean,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


def utcnow_naive() -> datetime:
    return datetime.now(UTC).replace(tzinfo=None)


class Vocabulary(Base):
    __tablename__ = "vocabularies"
    __table_args__ = (UniqueConstraint("source", "source_ref", name="uq_vocab_source_ref"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    lemma: Mapped[str] = mapped_column(String, index=True, nullable=False)
    part_of_speech: Mapped[str | None] = mapped_column(String, index=True, nullable=True)
    category: Mapped[str | None] = mapped_column(String, index=True, nullable=True)
    sub_category: Mapped[str | None] = mapped_column(String, index=True, nullable=True)
    source: Mapped[str] = mapped_column(String, default="manual", nullable=False)
    source_ref: Mapped[str] = mapped_column(String, nullable=False)
    status: Mapped[str] = mapped_column(String, default="active", nullable=False)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow_naive, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=utcnow_naive, onupdate=utcnow_naive, nullable=False
    )

    meanings: Mapped[list["VocabularyMeaning"]] = relationship(
        back_populates="vocabulary", cascade="all, delete-orphan"
    )
    examples: Mapped[list["VocabularyExample"]] = relationship(
        back_populates="vocabulary", cascade="all, delete-orphan"
    )
    tags: Mapped[list["VocabularyTagLink"]] = relationship(
        back_populates="vocabulary", cascade="all, delete-orphan"
    )
    german_detail: Mapped["VocabularyGermanDetail | None"] = relationship(
        back_populates="vocabulary", cascade="all, delete-orphan", uselist=False
    )
    srs_state: Mapped["VocabularySRSState | None"] = relationship(
        back_populates="vocabulary", cascade="all, delete-orphan", uselist=False
    )
    review_events: Mapped[list["ReviewEvent"]] = relationship(
        back_populates="vocabulary", cascade="all, delete-orphan"
    )


class VocabularyMeaning(Base):
    __tablename__ = "vocabulary_meanings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    vocabulary_id: Mapped[int] = mapped_column(ForeignKey("vocabularies.id"), index=True)
    language_code: Mapped[str] = mapped_column(String, index=True, nullable=False)
    text: Mapped[str] = mapped_column(Text, nullable=False)
    position: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    vocabulary: Mapped["Vocabulary"] = relationship(back_populates="meanings")


class VocabularyExample(Base):
    __tablename__ = "vocabulary_examples"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    vocabulary_id: Mapped[int] = mapped_column(ForeignKey("vocabularies.id"), index=True)
    language_code: Mapped[str] = mapped_column(String, default="de", nullable=False)
    text: Mapped[str] = mapped_column(Text, nullable=False)
    translation: Mapped[str | None] = mapped_column(Text, nullable=True)
    source: Mapped[str] = mapped_column(String, default="import", nullable=False)
    position: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    vocabulary: Mapped["Vocabulary"] = relationship(back_populates="examples")


class VocabularyTag(Base):
    __tablename__ = "vocabulary_tags"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False)
    tag_type: Mapped[str] = mapped_column(String, default="context", nullable=False)

    vocab_links: Mapped[list["VocabularyTagLink"]] = relationship(
        back_populates="tag", cascade="all, delete-orphan"
    )


class VocabularyTagLink(Base):
    __tablename__ = "vocabulary_tag_links"
    __table_args__ = (UniqueConstraint("vocabulary_id", "tag_id", name="uq_vocabulary_tag"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    vocabulary_id: Mapped[int] = mapped_column(ForeignKey("vocabularies.id"), index=True)
    tag_id: Mapped[int] = mapped_column(ForeignKey("vocabulary_tags.id"), index=True)

    vocabulary: Mapped["Vocabulary"] = relationship(back_populates="tags")
    tag: Mapped["VocabularyTag"] = relationship(back_populates="vocab_links")


class VocabularyGermanDetail(Base):
    __tablename__ = "vocabulary_german_details"

    vocabulary_id: Mapped[int] = mapped_column(
        ForeignKey("vocabularies.id"), primary_key=True, index=True
    )
    article: Mapped[str | None] = mapped_column(String, nullable=True)
    plural_form: Mapped[str | None] = mapped_column(String, nullable=True)
    transitivity: Mapped[str | None] = mapped_column(String, nullable=True)
    present_3sg: Mapped[str | None] = mapped_column(String, nullable=True)
    preterite: Mapped[str | None] = mapped_column(String, nullable=True)
    partizip_ii: Mapped[str | None] = mapped_column(String, nullable=True)
    auxiliary: Mapped[str | None] = mapped_column(String, nullable=True)
    is_strong_verb: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    comparative: Mapped[str | None] = mapped_column(String, nullable=True)
    superlative: Mapped[str | None] = mapped_column(String, nullable=True)
    verb_patterns: Mapped[str | None] = mapped_column(Text, nullable=True)

    vocabulary: Mapped["Vocabulary"] = relationship(back_populates="german_detail")


class VocabularySRSState(Base):
    __tablename__ = "vocabulary_srs_states"

    vocabulary_id: Mapped[int] = mapped_column(
        ForeignKey("vocabularies.id"), primary_key=True, index=True
    )
    ease_factor: Mapped[float] = mapped_column(Float, default=2.5, nullable=False)
    interval_days: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    repetitions: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    due_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    last_reviewed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    vocabulary: Mapped["Vocabulary"] = relationship(back_populates="srs_state")


class StudySession(Base):
    __tablename__ = "study_sessions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    started_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow_naive, nullable=False)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    total_cards: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    completed_cards: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    review_events: Mapped[list["ReviewEvent"]] = relationship(back_populates="session")


class ReviewEvent(Base):
    __tablename__ = "review_events"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    vocabulary_id: Mapped[int] = mapped_column(ForeignKey("vocabularies.id"), index=True)
    session_id: Mapped[int | None] = mapped_column(ForeignKey("study_sessions.id"), index=True)
    grade: Mapped[int] = mapped_column(Integer, nullable=False)
    reviewed_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow_naive, nullable=False)
    scheduled_interval_before: Mapped[int] = mapped_column(Integer, nullable=False)
    scheduled_interval_after: Mapped[int] = mapped_column(Integer, nullable=False)
    ease_before: Mapped[float] = mapped_column(Float, nullable=False)
    ease_after: Mapped[float] = mapped_column(Float, nullable=False)

    vocabulary: Mapped["Vocabulary"] = relationship(back_populates="review_events")
    session: Mapped["StudySession | None"] = relationship(back_populates="review_events")
