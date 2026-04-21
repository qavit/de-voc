import argparse
import os

from backend.database import Base, SessionLocal, engine
from backend.services.importer import import_records, load_json_records, load_review_decisions


def parse_args():
    parser = argparse.ArgumentParser(description="Import reviewed vocabulary data into SQLite.")
    parser.add_argument(
        "--input",
        default=os.path.join("data", "vocab.json"),
        help="Path to the extracted JSON records from scripts/convert.py",
    )
    parser.add_argument(
        "--review",
        default=os.path.join("data", "shift_review.csv"),
        help="Optional review CSV exported from scripts/anomaly_checker.py",
    )
    parser.add_argument(
        "--reset",
        action="store_true",
        help="Drop and recreate all tables before importing.",
    )
    return parser.parse_args()


def run_migration(input_path: str, review_path: str | None, reset: bool = False):
    if reset:
        print("Resetting database schema...")
        Base.metadata.drop_all(bind=engine)

    print("Ensuring database schema exists...")
    Base.metadata.create_all(bind=engine)

    records = load_json_records(input_path)
    decisions = load_review_decisions(review_path if review_path and os.path.exists(review_path) else None)

    print(f"Loaded {len(records)} source rows.")
    db = SessionLocal()
    try:
        summary = import_records(db, records, review_decisions=decisions, source_name="excel_import")
    finally:
        db.close()

    print(
        "Import completed. "
        f"Created {summary['created']} vocabularies, updated {summary['updated']} existing rows."
    )


if __name__ == "__main__":
    args = parse_args()
    run_migration(args.input, args.review, reset=args.reset)
