"""
Upload ProfitPulse_Tables.xlsx to Supabase.

Reads the two-sheet Excel file produced by the PCA notebook:
  - Sheet "Table_1_Proxies"  → table `financial_raw`
  - Sheet "Table_2_ProfitScore" → table `index_scores`

Column mapping
--------------
Table 1:
  Symbol       → firm_id
  Date         → year   (extract year from yyyy-12-31)
  ROA          → X1_ROA
  ROE          → X2_ROE
  ROC          → X3_ROC
  EPS          → X4_EPS
  NPM          → X5_NPM

Table 2:
  Symbol       → firm_id
  Date         → year
  Profit Score → p_t
  Percentile   → percentile_year
  Nhãn         → label_t  ("Tốt" → 0, "Kém" → 1)
  pc1/pc2/pc3  → NULL (not in this table; columns are nullable in DB)

Usage
-----
  python scripts/supabase/upload_profitpulse_tables.py
  python scripts/supabase/upload_profitpulse_tables.py --input path/to/Other.xlsx
"""
import argparse
import os
import sys

import numpy as np
import pandas as pd
from dotenv import load_dotenv
from supabase import create_client

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(SCRIPT_DIR, "../.."))
DEFAULT_INPUT = os.path.join(PROJECT_ROOT, "ProfitPulse_Tables.xlsx")

BATCH_SIZE = 200

# ---------------------------------------------------------------------------
# Supabase client
# ---------------------------------------------------------------------------
load_dotenv(os.path.join(PROJECT_ROOT, ".env"))
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SECRET_KEY = os.getenv("SUPABASE_SECRET_KEY")

if not SUPABASE_URL or not SUPABASE_SECRET_KEY:
    sys.exit("❌  Missing SUPABASE_URL or SUPABASE_SECRET_KEY in .env")

sb = create_client(SUPABASE_URL, SUPABASE_SECRET_KEY)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def df_to_records(df: pd.DataFrame) -> list[dict]:
    """Convert DataFrame → list[dict] with NaN → None and safe types."""
    df = df.copy().replace([np.inf, -np.inf], np.nan)

    for col in df.columns:
        if pd.api.types.is_datetime64_any_dtype(df[col]):
            df[col] = df[col].apply(
                lambda x: x.isoformat() if pd.notnull(x) else None
            )

    df = df.where(pd.notnull(df), None)
    records = df.to_dict(orient="records")

    # Ensure integer types for year / label_t
    int_cols = {"year", "label_t"}
    for rec in records:
        for k in int_cols:
            if k in rec and rec[k] is not None:
                try:
                    rec[k] = int(rec[k])
                except (TypeError, ValueError):
                    rec[k] = None

    return records


def chunked(lst, n):
    for i in range(0, len(lst), n):
        yield lst[i : i + n]


def upsert_table(table: str, df: pd.DataFrame, on_conflict: str):
    """Upsert a DataFrame to Supabase in batches."""
    records = df_to_records(df)
    if not records:
        print("   ⚠  No rows to upload (empty after cleaning).")
        return

    uploaded = 0
    for i, batch in enumerate(chunked(records, BATCH_SIZE), 1):
        try:
            sb.table(table).upsert(batch, on_conflict=on_conflict).execute()
            uploaded += len(batch)
        except Exception as exc:
            print(f"   ❌ Batch {i} failed: {exc}")
            # Retry row-by-row
            for rec in batch:
                try:
                    sb.table(table).upsert([rec], on_conflict=on_conflict).execute()
                    uploaded += 1
                except Exception as exc2:
                    print(f"   ❌ Row skipped — {exc2} | record: {rec}")

    print(f"   ✅ Uploaded {uploaded}/{len(records)} rows → {table}")


# ---------------------------------------------------------------------------
# Table 1: financial_raw
# ---------------------------------------------------------------------------
def upload_financial_raw(path: str):
    print("\n[1/2] ==> TABLE: financial_raw  (Sheet: Table_1_Proxies)")

    df = pd.read_excel(path, sheet_name="Table_1_Proxies")
    print(f"    Rows read : {len(df)}")

    # Extract year from Date column
    df["Date"] = pd.to_datetime(df["Date"], errors="coerce")
    df["year"] = df["Date"].dt.year

    df = df.rename(
        columns={
            "Symbol": "firm_id",
            "ROA": "X1_ROA",
            "ROE": "X2_ROE",
            "ROC": "X3_ROC",
            "EPS": "X4_EPS",
            "NPM": "X5_NPM",
        }
    )

    keep = ["firm_id", "year", "X1_ROA", "X2_ROE", "X3_ROC", "X4_EPS", "X5_NPM"]
    df = df[keep].dropna(subset=["firm_id", "year"])
    print(f"    Rows clean: {len(df)}")

    upsert_table("financial_raw", df, "firm_id,year")


# ---------------------------------------------------------------------------
# Table 2: index_scores
# ---------------------------------------------------------------------------
_LABEL_MAP = {"Tốt": 0, "Kém": 1}


def upload_index_scores(path: str):
    print("\n[2/2] ==> TABLE: index_scores  (Sheet: Table_2_ProfitScore)")

    df = pd.read_excel(path, sheet_name="Table_2_ProfitScore")
    print(f"    Rows read : {len(df)}")

    df["Date"] = pd.to_datetime(df["Date"], errors="coerce")
    df["year"] = df["Date"].dt.year

    df = df.rename(
        columns={
            "Symbol": "firm_id",
            "Profit Score": "p_t",
            "Percentile": "percentile_year",
            "Nhãn": "label_t",
        }
    )

    # Map label text → integer
    df["label_t"] = df["label_t"].map(_LABEL_MAP)

    keep = ["firm_id", "year", "p_t", "percentile_year", "label_t"]
    df = df[keep].dropna(subset=["firm_id", "year", "p_t"])
    print(f"    Rows clean: {len(df)}")

    # pc1, pc2, pc3 are not produced by this pipeline — leave as NULL in DB
    upsert_table("index_scores", df, "firm_id,year")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def main():
    parser = argparse.ArgumentParser(
        description="Upload ProfitPulse_Tables.xlsx to Supabase"
    )
    parser.add_argument(
        "--input",
        default=DEFAULT_INPUT,
        help="Path to ProfitPulse_Tables.xlsx (default: project root)",
    )
    args = parser.parse_args()

    if not os.path.exists(args.input):
        sys.exit(
            f"❌  File not found: {args.input}\n"
            "    Run the PCA notebook first to generate ProfitPulse_Tables.xlsx"
        )

    print("=" * 60)
    print("ProfitPulse — Upload Tables to Supabase")
    print("=" * 60)
    print(f"Input file : {args.input}")
    print(f"Supabase   : {SUPABASE_URL}")

    upload_financial_raw(args.input)
    upload_index_scores(args.input)

    print("\n🎉 DONE: Both tables uploaded successfully.")


if __name__ == "__main__":
    main()
