import tempfile
import unittest
from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from backend.models import Base, ReviewEvent, StudySession, Vocabulary, VocabularyTag
from backend.schemas import ReviewEventCreate
from backend.services.importer import build_anomaly_rows, import_records, load_review_decisions
from backend.services.srs import SRSStateSnapshot, apply_sm2_like_review
from backend.services.vocabulary import (
    create_due_session,
    get_overview_stats,
    list_vocabularies,
    record_review_event,
)


class FoundationTests(unittest.TestCase):
    def setUp(self):
        self.tempdir = tempfile.TemporaryDirectory()
        db_path = Path(self.tempdir.name) / "test.db"
        self.engine = create_engine(f"sqlite:///{db_path}", connect_args={"check_same_thread": False})
        Base.metadata.create_all(bind=self.engine)
        self.Session = sessionmaker(autocommit=False, autoflush=False, bind=self.engine)

    def tearDown(self):
        self.engine.dispose()
        self.tempdir.cleanup()

    def test_anomaly_rows_flag_shifted_values(self):
        rows = build_anomaly_rows(
            [
                {
                    "row_number": 1,
                    "單字": "sich erinnern",
                    "中文釋義": None,
                    "次類別": "A2",
                    "Unnamed: 7": "Alltag",
                    "Unnamed: 9": "記得",
                }
            ]
        )
        self.assertEqual(len(rows), 2)
        targets = {row["column_name"]: row["predicted_target_field"] for row in rows}
        self.assertEqual(targets["Unnamed: 7"], "context_tag")
        self.assertEqual(targets["Unnamed: 9"], "meaning_zh")

    def test_import_records_deduplicates_and_creates_relations(self):
        session = self.Session()
        records = [
            {
                "row_number": 1,
                "單字": "der Apfel",
                "單字及詞形變化": "Äpfel",
                "類別": "名詞",
                "次類別": "食物",
                "中文釋義": "蘋果",
                "英文釋義": "apple",
                "台文釋義": None,
                "Unnamed: 7": "Alltag",
                "Unnamed: 9": None,
            }
        ]
        first = import_records(session, records)
        second = import_records(session, records)

        self.assertEqual(first["created"], 1)
        self.assertEqual(second["updated"], 1)
        self.assertEqual(session.query(Vocabulary).count(), 1)
        self.assertEqual(session.query(VocabularyTag).count(), 1)
        vocab = session.query(Vocabulary).first()
        self.assertEqual(vocab.lemma, "Apfel")
        self.assertEqual(vocab.german_detail.article, "der")
        self.assertEqual(vocab.german_detail.plural_form, "Äpfel")

    def test_srs_review_records_event_and_updates_session(self):
        session = self.Session()
        import_records(
            session,
            [
                {
                    "row_number": 1,
                    "單字": "lernen",
                    "單字及詞形變化": "lernt, lernte, gelernt",
                    "類別": "動詞",
                    "次類別": "及物",
                    "中文釋義": "學習",
                    "英文釋義": "learn",
                    "台文釋義": None,
                    "Unnamed: 7": "Schule",
                    "Unnamed: 9": None,
                }
            ],
        )

        due = create_due_session(session, limit=10)
        vocab_id = due.cards[0].vocabulary.id
        result = record_review_event(
            session,
            ReviewEventCreate(vocabulary_id=vocab_id, grade=2, session_id=due.session.id),
        )

        self.assertEqual(result.interval_days, 1)
        self.assertEqual(session.query(ReviewEvent).count(), 1)
        db_session = session.query(StudySession).first()
        self.assertEqual(db_session.completed_cards, 1)
        self.assertIsNotNone(db_session.completed_at)

    def test_again_review_resets_repetitions_to_zero(self):
        session = self.Session()
        import_records(
            session,
            [
                {
                    "row_number": 1,
                    "單字": "lernen",
                    "單字及詞形變化": "lernt, lernte, gelernt",
                    "類別": "動詞",
                    "次類別": "及物",
                    "中文釋義": "學習",
                    "英文釋義": "learn",
                    "台文釋義": None,
                    "Unnamed: 7": "Schule",
                    "Unnamed: 9": None,
                }
            ],
        )

        due = create_due_session(session, limit=10)
        vocab_id = due.cards[0].vocabulary.id
        record_review_event(session, ReviewEventCreate(vocabulary_id=vocab_id, grade=2, session_id=due.session.id))
        second_due = create_due_session(session, limit=10)
        result = record_review_event(
            session,
            ReviewEventCreate(vocabulary_id=vocab_id, grade=0, session_id=second_due.session.id),
        )

        self.assertEqual(result.repetitions, 0)
        self.assertEqual(result.interval_days, 1)

    def test_list_vocabularies_supports_tag_filter(self):
        session = self.Session()
        import_records(
            session,
            [
                {
                    "row_number": 1,
                    "單字": "schnell",
                    "單字及詞形變化": "schneller, am schnellsten",
                    "類別": "形容詞",
                    "次類別": "描述",
                    "中文釋義": "快",
                    "英文釋義": "fast",
                    "台文釋義": None,
                    "Unnamed: 7": "Alltag",
                    "Unnamed: 9": None,
                }
            ],
        )
        response = list_vocabularies(session, tag="Alltag", page=1, page_size=10)
        self.assertEqual(response.total, 1)
        self.assertEqual(response.data[0].lemma, "schnell")

    def test_list_vocabularies_supports_meaning_text_search(self):
        session = self.Session()
        import_records(
            session,
            [
                {
                    "row_number": 1,
                    "單字": "schnell",
                    "單字及詞形變化": "schneller, am schnellsten",
                    "類別": "形容詞",
                    "次類別": "描述",
                    "中文釋義": "快",
                    "英文釋義": "fast",
                    "台文釋義": None,
                    "Unnamed: 7": "Alltag",
                    "Unnamed: 9": None,
                },
                {
                    "row_number": 2,
                    "單字": "langsam",
                    "單字及詞形變化": "langsamer, am langsamsten",
                    "類別": "形容詞",
                    "次類別": "描述",
                    "中文釋義": "慢",
                    "英文釋義": "slow",
                    "台文釋義": None,
                    "Unnamed: 7": "Alltag",
                    "Unnamed: 9": None,
                },
            ],
        )

        response = list_vocabularies(session, search="slow", page=1, page_size=10)
        self.assertEqual(response.total, 1)
        self.assertEqual(response.data[0].lemma, "langsam")

    def test_sm2_review_progression(self):
        initial = SRSStateSnapshot(ease_factor=2.5, interval_days=6, repetitions=2)
        updated = apply_sm2_like_review(initial, 3)
        self.assertGreater(updated.interval_days, initial.interval_days)
        self.assertGreater(updated.ease_factor, initial.ease_factor)

    def test_load_review_decisions_ignores_legacy_csv_without_row_number(self):
        csv_path = Path(self.tempdir.name) / "legacy_review.csv"
        csv_path.write_text(
            "單字,類別,次類別,Unnamed: 7,Proposed_次類別,中文釋義,Unnamed: 9,Proposed_中文釋義\n"
            "Abstand,Begriff,Eigenschaft,,Eigenschaft,距離,Entfernung,距離 (Note: Entfernung)\n",
            encoding="utf-8-sig",
        )

        decisions = load_review_decisions(str(csv_path))
        self.assertEqual(decisions, {})

    def test_get_overview_stats_counts_due_reviews_and_completed_sessions(self):
        session = self.Session()
        import_records(
            session,
            [
                {
                    "row_number": 1,
                    "單字": "lernen",
                    "單字及詞形變化": "lernt, lernte, gelernt",
                    "類別": "動詞",
                    "次類別": "及物",
                    "中文釋義": "學習",
                    "英文釋義": "learn",
                    "台文釋義": None,
                    "Unnamed: 7": "Schule",
                    "Unnamed: 9": None,
                },
                {
                    "row_number": 2,
                    "單字": "sprechen",
                    "單字及詞形變化": "spricht, sprach, gesprochen",
                    "類別": "動詞",
                    "次類別": "不及物",
                    "中文釋義": "說",
                    "英文釋義": "speak",
                    "台文釋義": None,
                    "Unnamed: 7": "Alltag",
                    "Unnamed: 9": None,
                },
            ],
        )

        due = create_due_session(session, limit=10)
        first_id = due.cards[0].vocabulary.id
        record_review_event(session, ReviewEventCreate(vocabulary_id=first_id, grade=2, session_id=due.session.id))

        stats = get_overview_stats(session)
        self.assertEqual(stats.reviewed_last_30_days, 1)
        self.assertEqual(stats.completed_sessions_last_30_days, 0)
        self.assertEqual(stats.due_cards, 1)


if __name__ == "__main__":
    unittest.main()
