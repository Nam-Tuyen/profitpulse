"""
Upload ProfitPulse data to Supabase
This script uploads all data files to Supabase following the load_order.xlsx sequence.
"""
import os
import json
import pandas as pd
from dotenv import load_dotenv
from supabase import create_client

# =========================
# CONFIG
# =========================
# Get the script directory and set paths
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(SCRIPT_DIR, "../.."))
DATA_DIR = os.path.join(PROJECT_ROOT, "data/exports")
LOAD_ORDER_PATH = os.path.join(DATA_DIR, "load_order.xlsx")

BATCH_SIZE = 100  # Reduced from 500 to isolate problematic records
JSONB_COLS = {"confusion_json", "roc_points_json", "feature_importance_json"}

# =========================
# INIT SUPABASE
# =========================
# Load environment variables from project root
load_dotenv(os.path.join(PROJECT_ROOT, ".env"))
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SECRET_KEY = os.getenv("SUPABASE_SECRET_KEY")

if not SUPABASE_URL or not SUPABASE_SECRET_KEY:
    raise ValueError("Missing SUPABASE_URL or SUPABASE_SECRET_KEY in .env file")

sb = create_client(SUPABASE_URL, SUPABASE_SECRET_KEY)


def df_to_records(df: pd.DataFrame):
    """Convert dataframe to list[dict], replace NaN -> None, convert Timestamps to strings, fix numeric types."""
    import numpy as np
    df = df.copy()
    
    # First, replace all inf/-inf with NaN across the entire dataframe
    df = df.replace([np.inf, -np.inf], np.nan)
    
    # Convert datetime/Timestamp columns to string
    for col in df.columns:
        if pd.api.types.is_datetime64_any_dtype(df[col]):
            df[col] = df[col].apply(lambda x: x.isoformat() if pd.notnull(x) else None)
        # Convert float columns that should be integers
        elif pd.api.types.is_float_dtype(df[col]):
            # Check if column name suggests it should be integer (year, id, etc.)
            if 'year' in col.lower() or 'id' == col.lower() or col.endswith('_id'):
                # Convert to int, keeping None for NaN values
                df[col] = df[col].apply(lambda x: int(x) if pd.notnull(x) and not pd.isna(x) else None)
    
    # Final cleanup: replace NaN with None
    df = df.where(pd.notnull(df), None)
    
    # Convert to records
    records = df.to_dict(orient="records")
    
    # Post-process: ensure all year fields are integers not strings
    for record in records:
        for key in record:
            if 'year' in key.lower() and record[key] is not None:
                if isinstance(record[key], (float, str)):
                    try:
                        record[key] = int(float(record[key]))
                    except (ValueError, TypeError):
                        record[key] = None
    
    return records


def chunked(lst, n):
    """Split list into chunks of size n."""
    for i in range(0, len(lst), n):
        yield lst[i:i + n]


def safe_json_load(x):
    """Parse JSON string -> dict for jsonb columns."""
    if x is None:
        return None
    if isinstance(x, (dict, list)):
        return x
    if isinstance(x, str):
        s = x.strip()
        if not s:
            return None
        try:
            return json.loads(s)
        except Exception:
            return None
    return None


def strict_dropna(df: pd.DataFrame):
    """Drop any rows that contain NULL in ANY column."""
    return df.dropna(how="any").copy()


def normalize_on_conflict(s: str) -> str:
    """
    Supabase Python upsert uses `on_conflict` as comma-separated columns.
    Normalize conflict key by removing spaces.
    """
    if not s or not isinstance(s, str):
        return ""
    return s.replace(" ", "")


def upload_table(table: str, df: pd.DataFrame, on_conflict: str):
    """Upsert dataframe to a table by batches."""
    records = df_to_records(df)
    if not records:
        print("   - Skipped (no rows after cleaning)")
        return

    # Try uploading in batches with better error handling
    total_uploaded = 0
    for i, batch in enumerate(chunked(records, BATCH_SIZE)):
        try:
            import json
            # Test serialize batch first
            json.dumps(batch)
            
            sb.table(table).upsert(batch, on_conflict=on_conflict).execute()
            total_uploaded += len(batch)
        except Exception as e:
            print(f"   ❌ ERROR in batch {i+1}: {e}")
            # Try each record individually to find the problematic one
            for j, record in enumerate(batch):
                try:
                    json.dumps([record])
                    sb.table(table).upsert([record], on_conflict=on_conflict).execute()
                    total_uploaded += 1
                except Exception as e2:
                    print(f"   ❌ Failed record {j} in batch {i+1}: {e2}")
                    print(f"      Record: {record}")
                    # Skip this record and continue
            
    print(f"   - Uploaded: {total_uploaded}/{len(records)} rows")


def main():
    """Main upload process."""
    if not os.path.exists(LOAD_ORDER_PATH):
        raise FileNotFoundError(f"Cannot find load_order.xlsx at: {LOAD_ORDER_PATH}")

    load_order = pd.read_excel(LOAD_ORDER_PATH).sort_values("order").reset_index(drop=True)

    print("✅ Found load_order.xlsx")
    print("✅ Start uploading from:", DATA_DIR)
    print(f"📊 Total tables to upload: {len(load_order)}\n")

    # Track uploaded company_pks for referential integrity
    uploaded_company_pks = set()

    for idx, r in enumerate(load_order.itertuples(index=False), 1):
        table = r.table
        file = r.file
        on_conflict = normalize_on_conflict(getattr(r, "upsert_key", ""))

        # Optional: skip QA table or map name
        if table == "_qa_missing_company_symbols":
            table = "qa_missing_company_symbols"

        path = os.path.join(DATA_DIR, file)
        if not os.path.exists(path):
            print(f"\n[{idx}/{len(load_order)}] [SKIP] Missing file: {path}")
            continue

        print(f"\n[{idx}/{len(load_order)}] ==> TABLE: {table}")
        print(f"    FILE : {file}")
        print(f"    KEY  : {on_conflict}")

        df = pd.read_excel(path)
        print(f"    ROWS : {len(df)} (before cleaning)")
        
        # Normalize column names to lowercase for Supabase compatibility
        df.columns = [col.lower() for col in df.columns]

        # 1) For companies table, only drop rows with nulls in PK field
        if table == "companies":
            # Only drop rows with null company_pk, keep others even if they have some nulls
            df = df[df['company_pk'].notna()]
            uploaded_company_pks = set(df['company_pk'].unique())
            print(f"    CLEAN: {len(df)} (after removing null company_pk)")
        # 2) For tables with company_pk FK, filter to only uploaded companies
        elif 'company_pk' in df.columns and uploaded_company_pks:
            df_before = len(df)
            df = df[df['company_pk'].isin(uploaded_company_pks)]
            # Then drop nulls
            df = strict_dropna(df)
            print(f"    CLEAN: {len(df)} (filtered by FK and removed nulls, was {df_before})")
        else:
            # 3) Standard: strict drop null rows
            df = strict_dropna(df)
            print(f"    CLEAN: {len(df)} (after removing nulls)")

        # Parse jsonb columns
        for c in JSONB_COLS:
            if c in df.columns:
                df[c] = df[c].apply(safe_json_load)

        # Upsert
        if not on_conflict:
            # If table has PK only and no upsert key, fallback to insert
            print("   [WARN] No on_conflict key. Using insert() instead of upsert().")
            records = df_to_records(df)
            for batch in chunked(records, BATCH_SIZE):
                sb.table(table).insert(batch).execute()
            print(f"   - Inserted: {len(records)} rows")
        else:
            upload_table(table, df, on_conflict)

    print("\n🎉 DONE: All files uploaded following load_order.xlsx")


if __name__ == "__main__":
    main()
