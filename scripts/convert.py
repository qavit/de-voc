import argparse
import json
from pathlib import Path

import pandas as pd


def parse_args():
    parser = argparse.ArgumentParser(description="Extract Excel vocabulary rows into JSON.")
    parser.add_argument("input", help="Path to the source Excel file")
    parser.add_argument(
        "--output",
        default=str(Path("data") / "vocab.json"),
        help="Path to the JSON export",
    )
    return parser.parse_args()


def main():
    args = parse_args()

    df = pd.read_excel(args.input)
    df = df.dropna(how="all")
    df = df.where(pd.notnull(df), None)
    df.insert(0, "row_number", range(1, len(df) + 1))

    records = df.to_dict(orient="records")
    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    with output_path.open("w", encoding="utf-8") as handle:
        json.dump(records, handle, ensure_ascii=False, indent=2)

    print(f"Exported {len(records)} records to {output_path}")
    print("Columns:", df.columns.tolist())


if __name__ == "__main__":
    main()
