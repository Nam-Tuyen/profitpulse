"""
Upload ProfitPulse_Tables.xlsx to Supabase

  Table_1_Proxies   → financial_raw   (firm_id, year, X1_ROA…X5_NPM)
  Table_2_ProfitScore → index_scores  (firm_id, year, p_t, label_t, percentile_year)

Usage
-----
  # Default: looks for ProfitPulse_Tables.xlsx in the project root
  python scripts/supabase/upload_tables.py

  # Custom path
  TABLES_EXCEL_PATH=/path/to/ProfitPulse_Tables.xlsx python scripts/supabase/upload_tables.py

Label mapping (Nhãn → label_t)
  "Tốt"  (P_t > 0)  → 1  (Risk Cao  / High Risk)
  "Kém"  (P_t ≤ 0)  → 0  (Risk Thấp / Low  Risk)
This matches the existing convention: (P_t > 0).astype(int) from the thesis pipeline.
"""

import os
import sys
import numpy as np
import pandas as pd
from dotenv import load_dotenv
from supabase import create_client

# ─── CONFIG ───────────────────────────────────────────────────────────────────
SCRIPT_DIR   = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(SCRIPT_DIR, "../.."))

INPUT_EXCEL = os.environ.get(
    "TABLES_EXCEL_PATH",
    os.path.join(PROJECT_ROOT, "ProfitPulse_Tables.xlsx"),
)

BATCH_SIZE = 200

# ─── SUPABASE ─────────────────────────────────────────────────────────────────
load_dotenv(os.path.join(PROJECT_ROOT, ".env"))
SUPABASE_URL        = os.getenv("SUPABASE_URL")
SUPABASE_SECRET_KEY = os.getenv("SUPABASE_SECRET_KEY")

if not SUPABASE_URL or not SUPABASE_SECRET_KEY:
    print("❌  Missing SUPABASE_URL or SUPABASE_SECRET_KEY in .env")
    sys.exit(1)

sb = create_client(SUPABASE_URL, SUPABASE_SECRET_KEY)


# ─── HELPERS ──────────────────────────────────────────────────────────────────
def df_to_records(df: pd.DataFrame) -> list:
    """Convert DataFrame to list[dict], replacing NaN/inf with None."""
    df = df.copy().replace([np.inf, -np.inf], np.nan)
    for col in df.columns:
        if pd.api.types.is_datetime64_any_dtype(df[col]):
            df[col] = df[col].apply(
                lambda x: x.isoformat() if pd.notnull(x) else None
            )
    df = df.where(pd.notnull(df), None)
    return df.to_dict(orient="records")


def chunked(lst, n):
    for i in range(0, len(lst), n):
        yield lst[i : i + n]


def upsert_table(table: str, records: list, on_conflict: str):
    total, errors = 0, 0
    for batch in chunked(records, BATCH_SIZE):
        try:
            sb.table(table).upsert(batch, on_conflict=on_conflict).execute()
            total += len(batch)
        except Exception as exc:
            print(f"   ❌ Batch error: {exc}")
            # Retry row-by-row to isolate bad records
            for record in batch:
                try:
                    sb.table(table).upsert([record], on_conflict=on_conflict).execute()
                    total += 1
                except Exception as exc2:
                    print(f"      ❌ Row skipped: {exc2} | record={record}")
                    errors += 1
    print(f"   ✅ Upserted {total} rows  (skipped: {errors})")


def ensure_companies(symbols: list):
    """Insert any symbols that are missing from the companies table."""
    resp            = sb.table("companies").select("symbol").execute()
    existing_syms   = {r["symbol"] for r in resp.data}
    exch_map        = {"HM": "HoSE", "HN": "HNX", "UP": "UPCOM"}

    new_rows = []
    for sym in symbols:
        if sym in existing_syms:
            continue
        parts   = sym.rsplit(".", 1)
        ticker  = parts[0]
        exch    = exch_map.get(parts[1], parts[1]) if len(parts) > 1 else ""
        new_rows.append(
            {"symbol": sym, "ticker": ticker, "company_name": None, "exchange_name": exch}
        )

    if new_rows:
        print(f"   ℹ️  Inserting {len(new_rows)} new company entries…")
        for batch in chunked(new_rows, BATCH_SIZE):
            sb.table("companies").upsert(batch, on_conflict="symbol").execute()
        print(f"   ✅ Companies ensured ({len(new_rows)} new)")
    else:
        print("   ✅ All companies already exist in DB")


# ─── TABLE 1 → financial_raw ─────────────────────────────────────────────────
def upload_table1(excel_path: str):
    print("\n📥  [TABLE 1]  financial_raw")
    df = pd.read_excel(excel_path, sheet_name="Table_1_Proxies")
    print(f"   Raw rows: {len(df)}")

    # Date (yyyy-12-31) → integer year
    df["Date"] = pd.to_datetime(df["Date"], errors="coerce")
    df["year"] = df["Date"].dt.year
    df = df.dropna(subset=["Symbol", "year"]).copy()
    df["year"] = df["year"].astype(int)

    # Rename to match schema
    df = df.rename(
        columns={
            "Symbol": "firm_id",
            "ROA":    "X1_ROA",
            "ROE":    "X2_ROE",
            "ROC":    "X3_ROC",
            "EPS":    "X4_EPS",
            "NPM":    "X5_NPM",
        }
    )

    # Make sure referenced companies exist first
    ensure_companies(df["firm_id"].unique().tolist())

    keep = ["firm_id", "year", "X1_ROA", "X2_ROE", "X3_ROC", "X4_EPS", "X5_NPM"]
    df   = df[[c for c in keep if c in df.columns]]
    print(f"   Rows to upsert: {len(df)}")

    upsert_table("financial_raw", df_to_records(df), "firm_id,year")


# ─── TABLE 2 → index_scores ──────────────────────────────────────────────────
def upload_table2(excel_path: str):
    print("\n📥  [TABLE 2]  index_scores")
    df = pd.read_excel(excel_path, sheet_name="Table_2_ProfitScore")
    print(f"   Raw rows: {len(df)}")

    # Date (yyyy-12-31) → integer year
    df["Date"] = pd.to_datetime(df["Date"], errors="coerce")
    df["year"] = df["Date"].dt.year
    df = df.dropna(subset=["Symbol", "year", "Profit Score"]).copy()
    df["year"] = df["year"].astype(int)

    # Rename to match schema
    df = df.rename(
        columns={
            "Symbol":       "firm_id",
            "Profit Score": "p_t",
            "Percentile":   "percentile_year",
        }
    )

    # Nhãn → label_t:  "Tốt" (P_t > 0) → 1 (Risk Cao),  "Kém" → 0 (Risk Thấp)
    # This matches the thesis rule: (P_t > 0).astype(int)
    if "Nhãn" in df.columns:
        df["label_t"] = df["Nhãn"].map({"Tốt": 1, "Kém": 0}).fillna(0).astype(int)
    else:
        # Derive directly from p_t when Nhãn column is absent
        df["label_t"] = (df["p_t"] > 0).astype(int)

    keep = ["firm_id", "year", "p_t", "label_t", "percentile_year"]
    df   = df[[c for c in keep if c in df.columns]]
    print(f"   Rows to upsert: {len(df)}")

    upsert_table("index_scores", df_to_records(df), "firm_id,year")


# ─── MAIN ─────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    if not os.path.exists(INPUT_EXCEL):
        print(
            f"❌  File not found: {INPUT_EXCEL}\n"
            "    Generate it first by running the ProfitPulse Jupyter notebook,\n"
            "    then place ProfitPulse_Tables.xlsx in the project root."
        )
        sys.exit(1)

    print(f"📂  Source : {INPUT_EXCEL}")
    print(f"🌐  Target : {SUPABASE_URL}")

    upload_table1(INPUT_EXCEL)
    upload_table2(INPUT_EXCEL)

    print("\n🎉  Done — both tables uploaded successfully!")
