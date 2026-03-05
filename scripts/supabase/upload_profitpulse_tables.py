"""
upload_profitpulse_tables.py

Processes Data.xlsx using leakage-safe PCA methodology and uploads to Supabase:
  - financial_raw          : 5 proxy metrics (ROA, ROE, ROC, EPS, NPM) per firm-year
  - proxies_raw            : same as financial_raw with pretty column names
  - proxies_winsor         : winsorized proxy values
  - winsor_bounds          : per-column winsorization bounds used in fit
  - index_scores           : PCA Profit Score, Percentile, label_t, PC1-PC3 per firm-year
  - forecast_dataset       : combined proxies + PCA scores (training dataset)
  - predictions            : latest-year scores as baseline prediction
  - qa_missing_company_symbols : firm-year rows with at least one missing proxy

Usage:
  cd "C:\\Users\\NAM TUYEN LE\\Downloads\\Project code\\profitpulse"
  python scripts/supabase/upload_profitpulse_tables.py

Requirements:
  - Data.xlsx at project root (or set INPUT_PATH)
  - .env with SUPABASE_URL and SUPABASE_SECRET_KEY
  - pip install supabase python-dotenv scikit-learn openpyxl
"""

import warnings
warnings.filterwarnings("ignore")

import os
import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler
from sklearn.decomposition import PCA
from dotenv import load_dotenv
from supabase import create_client

# =========================
# CONFIG
# =========================
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(SCRIPT_DIR, "../.."))
INPUT_PATH = os.path.join(PROJECT_ROOT, "Data.xlsx")

PAR_VALUE = 10_000        # Mệnh giá cổ phiếu (VND)
WINSOR_Q = 0.01           # Winsorization quantile (1% – 99%)
TRAIN_TARGET_END_YEAR = 2020
PREPROCESS_FIT_PRED_YEAR = TRAIN_TARGET_END_YEAR - 1  # 2019 – fit scaler/PCA on data up to this year

X_COLS = ["X1_ROA", "X2_ROE", "X3_ROC", "X4_EPS", "X5_NPM"]
MAIN_K = 3               # Number of PCA components

BATCH_SIZE = 100

PRETTY = {
    "X1_ROA": "ROA",
    "X2_ROE": "ROE",
    "X3_ROC": "ROC",
    "X4_EPS": "EPS",
    "X5_NPM": "NPM",
}

# =========================
# INIT SUPABASE
# =========================
load_dotenv(os.path.join(PROJECT_ROOT, ".env"))
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SECRET_KEY = os.getenv("SUPABASE_SECRET_KEY")

if not SUPABASE_URL or not SUPABASE_SECRET_KEY:
    raise ValueError("Missing SUPABASE_URL or SUPABASE_SECRET_KEY in .env file")

sb = create_client(SUPABASE_URL, SUPABASE_SECRET_KEY)
print("✅ Supabase connected")

# =========================
# HELPERS
# =========================
def require_cols(df, cols):
    miss = [c for c in cols if c not in df.columns]
    if miss:
        raise ValueError(f"Missing columns in Data.xlsx: {miss}")


def safe_div(a: pd.Series, b: pd.Series) -> pd.Series:
    return a / b.replace(0, np.nan)


def winsor_bounds_from_train(df_train: pd.DataFrame, cols: list, q: float) -> dict:
    return {c: (df_train[c].quantile(q), df_train[c].quantile(1 - q)) for c in cols}


def apply_winsor_bounds(df_in: pd.DataFrame, bounds: dict) -> pd.DataFrame:
    df = df_in.copy()
    for c, (lo, hi) in bounds.items():
        if c in df.columns:
            df[c] = df[c].clip(lower=lo, upper=hi)
    return df


def df_to_records(df: pd.DataFrame) -> list:
    """Convert DataFrame -> list[dict], replacing NaN/inf with None."""
    df = df.copy().replace([np.inf, -np.inf], np.nan)
    records = []
    for row in df.to_dict(orient="records"):
        cleaned = {}
        for k, v in row.items():
            if v is None:
                cleaned[k] = None
            elif isinstance(v, float) and (np.isnan(v) or np.isinf(v)):
                cleaned[k] = None
            elif isinstance(v, (np.integer,)):
                cleaned[k] = int(v)
            elif isinstance(v, (np.floating,)):
                cleaned[k] = float(v)
            else:
                cleaned[k] = v
        records.append(cleaned)
    return records


def chunked(lst: list, n: int):
    for i in range(0, len(lst), n):
        yield lst[i:i + n]


def upsert_table(table: str, df: pd.DataFrame, on_conflict: str, skip_if_empty: bool = False):
    """Upsert DataFrame to a Supabase table in batches."""
    if df.empty:
        if skip_if_empty:
            print(f"   ⏭  Skipped (empty dataframe)")
            return
    records = df_to_records(df)
    if not records:
        print(f"   ⏭  No records to upload")
        return
    total = 0
    for batch in chunked(records, BATCH_SIZE):
        try:
            sb.table(table).upsert(batch, on_conflict=on_conflict).execute()
            total += len(batch)
        except Exception as e:
            print(f"   ❌ Batch error ({len(batch)} rows): {e}")
            # retry record by record
            for rec in batch:
                try:
                    sb.table(table).upsert([rec], on_conflict=on_conflict).execute()
                    total += 1
                except Exception as e2:
                    fid = rec.get("firm_id", rec.get("symbol", "?"))
                    yr = rec.get("year", "?")
                    print(f"   ❌ Failed {fid} {yr}: {e2}")
    print(f"   ✅ {total}/{len(records)} rows upserted → {table}")


# =========================
# STEP 1 – LOAD DATA
# =========================
print(f"\n📂 Loading {INPUT_PATH} ...")
if not os.path.exists(INPUT_PATH):
    raise FileNotFoundError(
        f"Data.xlsx not found at {INPUT_PATH}. "
        "Please place Data.xlsx in the project root."
    )

df_raw = pd.read_excel(INPUT_PATH)
df_raw.columns = [c.strip() for c in df_raw.columns]

# Detect symbol column
symbol_col = (
    "Symbol" if "Symbol" in df_raw.columns else
    "SYMBOL" if "SYMBOL" in df_raw.columns else
    "FIRM_ID"
)

require_cols(df_raw, [symbol_col, "YEAR", "TA", "EQ_P", "SH_ISS", "EPS_B", "REV"])
if "NI_P" not in df_raw.columns and "NI_AT" not in df_raw.columns:
    raise ValueError("Data.xlsx must contain NI_P or NI_AT to compute ROA/ROE/ROC/NPM")

print(f"   Detected symbol column: '{symbol_col}'")
print(f"   Raw rows: {len(df_raw)}, columns: {list(df_raw.columns)}")

# Standardize YEAR
df_raw["YEAR"] = pd.to_datetime(df_raw["YEAR"], errors="coerce").dt.year
df_raw = df_raw.dropna(subset=[symbol_col, "YEAR"]).copy()
df_raw["YEAR"] = df_raw["YEAR"].astype(int)

# Cast numeric columns
for c in ["NI_P", "NI_AT", "TA", "EQ_P", "SH_ISS", "EPS_B", "REV"]:
    if c in df_raw.columns:
        df_raw[c] = pd.to_numeric(df_raw[c], errors="coerce")

# Sort: gom theo năm (group by year), then firm
df_raw = df_raw.sort_values(["YEAR", symbol_col]).reset_index(drop=True)

# =========================
# STEP 2 – BUILD 5 PROXIES
# =========================
if "NI_P" in df_raw.columns and "NI_AT" in df_raw.columns:
    df_raw["NI_USED"] = df_raw["NI_P"].where(df_raw["NI_P"].notna(), df_raw["NI_AT"])
elif "NI_P" in df_raw.columns:
    df_raw["NI_USED"] = df_raw["NI_P"]
else:
    df_raw["NI_USED"] = df_raw["NI_AT"]

df_raw["X1_ROA"] = safe_div(df_raw["NI_USED"], df_raw["TA"])
df_raw["X2_ROE"] = safe_div(df_raw["NI_USED"], df_raw["EQ_P"])
df_raw["PAID_UP_CAP"] = df_raw["SH_ISS"] * PAR_VALUE
df_raw["X3_ROC"] = safe_div(df_raw["NI_USED"], df_raw["PAID_UP_CAP"])
df_raw["X4_EPS"] = df_raw["EPS_B"]
df_raw["X5_NPM"] = safe_div(df_raw["NI_USED"], df_raw["REV"])

for c in X_COLS:
    df_raw[c] = df_raw[c].replace([np.inf, -np.inf], np.nan)

years_all = sorted(df_raw["YEAR"].unique())
print(f"   Years found: {years_all}")
print(f"   Companies found: {df_raw[symbol_col].nunique()}")

# =========================
# STEP 3 – FILTER COMPLETE ROWS (all 5 proxies present)
# =========================
dfx = df_raw.dropna(subset=X_COLS).copy()
df_missing = df_raw[df_raw[X_COLS].isna().any(axis=1)].copy()

print(f"   Rows with all 5 proxies: {len(dfx)}")
print(f"   Rows with ≥1 missing proxy (→ qa table): {len(df_missing)}")

# =========================
# STEP 4 – LEAKAGE-SAFE PCA
# Fit winsor + scaler + PCA on predictor-year ≤ 2019 only
# =========================
df_fit = dfx[dfx["YEAR"] <= PREPROCESS_FIT_PRED_YEAR].copy()
if len(df_fit) < 10:
    raise ValueError(
        f"Too few observations (n={len(df_fit)}) in fit window (YEAR ≤ {PREPROCESS_FIT_PRED_YEAR}). "
        "Check that Data.xlsx contains data for years before 2019."
    )
print(f"\n📐 Fitting on YEAR ≤ {PREPROCESS_FIT_PRED_YEAR}: {len(df_fit)} rows")

# Winsorize using train-only bounds
bounds = winsor_bounds_from_train(df_fit, X_COLS, WINSOR_Q)
dfx_w = apply_winsor_bounds(dfx, bounds)
df_fit_w = dfx_w[dfx_w["YEAR"] <= PREPROCESS_FIT_PRED_YEAR].copy()

# Standardize
scaler = StandardScaler()
X_fit_std = scaler.fit_transform(df_fit_w[X_COLS].values)

# PCA fit
pca_k = PCA(n_components=MAIN_K, random_state=42).fit(X_fit_std)
lambdas = pca_k.explained_variance_
omega = lambdas / np.sum(lambdas)   # eigenvalue weight for each PC

print(f"   PCA eigenvalue weights (omega): {omega.round(4)}")
print(f"   Explained variance by PC: {pca_k.explained_variance_ratio_.round(4)}")

# Transform ALL years using TRAIN-fitted scaler + PCA
X_all_std = scaler.transform(dfx_w[X_COLS].values)
PC_all = pca_k.transform(X_all_std)      # shape (n, MAIN_K)
P_t = (PC_all * omega.reshape(1, -1)).sum(axis=1)

dfx_w = dfx_w.copy()
dfx_w["P_t"] = P_t
dfx_w["PC1"] = PC_all[:, 0]
dfx_w["PC2"] = PC_all[:, 1]
dfx_w["PC3"] = PC_all[:, 2]

# Percentile within each year (0-100), sorted ascending
dfx_w["Percentile"] = (
    dfx_w.groupby("YEAR")["P_t"]
    .rank(pct=True, method="average") * 100
)

# label_t = 1 when P_t > 0 (consistent with existing backend: label_t=1 → Risk Cao)
dfx_w["label_t"] = (dfx_w["P_t"] > 0).astype(int)

print(f"   P_t range: [{dfx_w['P_t'].min():.3f}, {dfx_w['P_t'].max():.3f}]")
print(f"   label_t=1 (P_t>0): {(dfx_w['label_t']==1).sum()}, label_t=0: {(dfx_w['label_t']==0).sum()}")

# =========================
# STEP 5 – BUILD UPLOAD DATAFRAMES
# All sorted by YEAR then firm_id (gom lại theo năm)
# =========================

# --- financial_raw: firm_id, year, X1_ROA ... X5_NPM ---
financial_raw = (
    dfx_w[[symbol_col, "YEAR", "X1_ROA", "X2_ROE", "X3_ROC", "X4_EPS", "X5_NPM"]]
    .rename(columns={symbol_col: "firm_id", "YEAR": "year"})
    .sort_values(["year", "firm_id"])
    .reset_index(drop=True)
)

# --- proxies_raw: firm_id, year, ROA, ROE, ROC, EPS, NPM (pretty column names) ---
proxies_raw = (
    dfx[[symbol_col, "YEAR", "X1_ROA", "X2_ROE", "X3_ROC", "X4_EPS", "X5_NPM"]]
    .rename(columns={
        symbol_col: "firm_id",
        "YEAR": "year",
        "X1_ROA": "roa",
        "X2_ROE": "roe",
        "X3_ROC": "roc",
        "X4_EPS": "eps",
        "X5_NPM": "npm",
    })
    .sort_values(["year", "firm_id"])
    .reset_index(drop=True)
)

# --- proxies_winsor: winsorized values ---
proxies_winsor = (
    dfx_w[[symbol_col, "YEAR", "X1_ROA", "X2_ROE", "X3_ROC", "X4_EPS", "X5_NPM"]]
    .rename(columns={
        symbol_col: "firm_id",
        "YEAR": "year",
        "X1_ROA": "roa_w",
        "X2_ROE": "roe_w",
        "X3_ROC": "roc_w",
        "X4_EPS": "eps_w",
        "X5_NPM": "npm_w",
    })
    .sort_values(["year", "firm_id"])
    .reset_index(drop=True)
)

# --- winsor_bounds: per-column quantile bounds ---
winsor_bounds_df = pd.DataFrame([
    {"column_name": c, "lower_bound": lo, "upper_bound": hi, "quantile": WINSOR_Q}
    for c, (lo, hi) in bounds.items()
])

# --- index_scores: firm_id, year, p_t, label_t, pc1, pc2, pc3, percentile_year ---
index_scores = (
    dfx_w[[symbol_col, "YEAR", "P_t", "label_t", "PC1", "PC2", "PC3", "Percentile"]]
    .rename(columns={
        symbol_col: "firm_id",
        "YEAR": "year",
        "P_t": "p_t",
        "PC1": "pc1",
        "PC2": "pc2",
        "PC3": "pc3",
        "Percentile": "percentile_year",
    })
    .sort_values(["year", "firm_id"])
    .reset_index(drop=True)
)

# --- forecast_dataset: full combined dataset used for model training ---
forecast_dataset = (
    dfx_w[[
        symbol_col, "YEAR",
        "X1_ROA", "X2_ROE", "X3_ROC", "X4_EPS", "X5_NPM",
        "PC1", "PC2", "PC3",
        "P_t", "Percentile", "label_t",
    ]]
    .rename(columns={
        symbol_col: "firm_id",
        "YEAR": "year",
        "P_t": "p_t",
        "PC1": "pc1",
        "PC2": "pc2",
        "PC3": "pc3",
        "Percentile": "percentile_year",
    })
    .sort_values(["year", "firm_id"])
    .reset_index(drop=True)
)

# --- predictions: latest year's computed scores as baseline prediction ---
latest_year = int(dfx_w["YEAR"].max())
predictions = index_scores[index_scores["year"] == latest_year].copy()

# --- qa_missing_company_symbols: firm-year pairs with ≥1 missing proxy ---
qa_missing = (
    df_missing[[symbol_col, "YEAR"]]
    .rename(columns={symbol_col: "firm_id", "YEAR": "year"})
    .copy()
)
# Add per-proxy missing flags
for col in X_COLS:
    qa_missing[f"{col.lower()}_missing"] = df_missing[col].isna().astype(int).values
qa_missing = qa_missing.sort_values(["year", "firm_id"]).reset_index(drop=True)

# Summary
print(f"\n📊 Dataframes ready:")
print(f"   financial_raw        : {financial_raw.shape}")
print(f"   proxies_raw          : {proxies_raw.shape}")
print(f"   proxies_winsor       : {proxies_winsor.shape}")
print(f"   winsor_bounds        : {winsor_bounds_df.shape}")
print(f"   index_scores         : {index_scores.shape}")
print(f"   forecast_dataset     : {forecast_dataset.shape}")
print(f"   predictions (yr={latest_year}): {predictions.shape}")
print(f"   qa_missing           : {qa_missing.shape}")

# =========================
# STEP 6 – UPLOAD TO SUPABASE
# =========================
print("\n🚀 Uploading to Supabase...")

print("\n[1/8] → financial_raw")
upsert_table("financial_raw", financial_raw, "firm_id,year")

print("\n[2/8] → proxies_raw")
upsert_table("proxies_raw", proxies_raw, "firm_id,year")

print("\n[3/8] → proxies_winsor")
upsert_table("proxies_winsor", proxies_winsor, "firm_id,year")

print("\n[4/8] → winsor_bounds")
upsert_table("winsor_bounds", winsor_bounds_df, "column_name")

print("\n[5/8] → index_scores")
upsert_table("index_scores", index_scores, "firm_id,year")

print("\n[6/8] → forecast_dataset")
upsert_table("forecast_dataset", forecast_dataset, "firm_id,year")

print("\n[7/8] → predictions")
upsert_table("predictions", predictions, "firm_id,year")

print("\n[8/8] → qa_missing_company_symbols")
upsert_table("qa_missing_company_symbols", qa_missing, "firm_id,year", skip_if_empty=True)

print("\n🎉 All uploads complete!")
print(f"   financial_raw : {len(financial_raw)} rows")
print(f"   index_scores  : {len(index_scores)} rows, years {sorted(index_scores['year'].unique())}")
print(f"   predictions   : {len(predictions)} rows (year={latest_year})")
print(f"   qa_missing    : {len(qa_missing)} rows")
