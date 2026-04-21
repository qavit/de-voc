import argparse
import csv
from pathlib import Path

from backend.services.importer import build_anomaly_rows, load_json_records


def parse_args():
    parser = argparse.ArgumentParser(description="Generate an anomaly review CSV for shifted columns.")
    parser.add_argument(
        "--input",
        default=str(Path("data") / "vocab.json"),
        help="Path to the extracted JSON records",
    )
    parser.add_argument(
        "--output",
        default=str(Path("data") / "shift_review.csv"),
        help="Path to the review CSV",
    )
    return parser.parse_args()


def main():
    args = parse_args()
    records = load_json_records(args.input)
    anomaly_rows = build_anomaly_rows(records)

    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    fieldnames = [
        "row_number",
        "word",
        "column_name",
        "original_value",
        "predicted_target_field",
        "proposed_value",
        "confidence",
        "review_status",
        "review_note",
        "existing_sub_category",
        "existing_meaning_zh",
    ]

    with output_path.open("w", encoding="utf-8-sig", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(anomaly_rows)

    print(f"Found {len(anomaly_rows)} anomalies and exported them to {output_path}")
    print("Review the review_status/review_note columns, then pass the CSV to backend/migrate_db.py")


if __name__ == "__main__":
    main()
