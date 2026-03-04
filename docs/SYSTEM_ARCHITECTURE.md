# ProfitPulse - System Architecture

Technical architecture following FRS & SRS specifications.

---

## 📐 Architecture Overview (SRS 2.2)

```
┌──────────────────────────────────────────────────────────┐
│                    ProfitPulse System                    │
│              Batch Precompute Architecture               │
└──────────────────────────────────────────────────────────┘

┌──────────────┐         ┌───────────────┐         ┌──────────────┐
│   Frontend   │         │    Backend    │         │   Database   │
│   (Vercel)   │◄───────►│   (Render)    │◄───────►│  (Supabase)  │
├──────────────┤  HTTPS  ├───────────────┤  pgSQL  ├──────────────┤
│ React/Vite   │         │ Flask API     │         │ PostgreSQL   │
│              │         │ + Batch       │         │              │
│ • Home       │         │ Pipeline      │         │ • financial_ │
│ • Screener   │         │               │         │   raw        │
│ • Company    │         │ Endpoints:    │         │ • proxies    │
│ • How it     │         │ • Public      │         │ • pca_       │
│   works      │         │ • Auth        │         │   artifacts  │
│ • Model      │         │ • Admin       │         │ • index_     │
│   perf       │         │               │         │   scores     │
│ • Watchlist  │         │               │         │ • predictions│
│ • Alerts     │         │               │         │ • model_     │
│              │         │               │         │   performance│
└──────────────┘         └───────────────┘         └──────────────┘
       │                         │                         │
       └─────────────────────────┴─────────────────────────┘
                    JWT Auth (Supabase Auth)
                    RLS (Row Level Security)
```

---

## 🗄️ Database Schema (SRS 2.3)

### Raw Data Tables
```sql
-- FRS-RULE-01: Raw data unchanged
financial_raw (
  firm_id TEXT,
  year INT,
  ta NUMERIC,
  eq_p NUMERIC,
  sh_iss NUMERIC,
  eps_b NUMERIC,
  rev NUMERIC,
  ni_p NUMERIC,        -- nullable
  ni_at NUMERIC,       -- nullable
  PRIMARY KEY (firm_id, year)
)

company_master (
  symbol TEXT PRIMARY KEY,
  company_name TEXT,
  exchange_name TEXT,
  gics_industry_name TEXT,
  ...
)
```

### Processed Tables
```sql
-- FRS-RULE-02/03: Proxies + is_complete flag
proxies (
  firm_id TEXT,
  year INT,
  ni_used NUMERIC,
  paid_up_cap NUMERIC,
  x1_roa NUMERIC,      -- NI_USED/TA
  x2_roe NUMERIC,      -- NI_USED/EQ_P
  x3_roc NUMERIC,      -- NI_USED/(SH_ISS*PAR_VALUE)
  x4_eps NUMERIC,      -- EPS_B
  x5_npm NUMERIC,      -- NI_USED/REV
  is_complete BOOLEAN, -- true if all 5 proxies non-null
  PRIMARY KEY (firm_id, year)
)

-- FRS-ADM-04: Model version tracking
model_versions (
  model_version_id UUID PRIMARY KEY,
  random_state INT DEFAULT 42,
  par_value INT DEFAULT 10000,
  winsor_q NUMERIC DEFAULT 0.01,
  train_target_end_year INT DEFAULT 2020,
  preprocess_fit_pred_year INT DEFAULT 2019,
  test_target_years INT[],
  main_k INT DEFAULT 3,
  created_at TIMESTAMP
)

-- FRS-ADM-05: Winsor bounds (train-only)
winsor_bounds (
  model_version_id UUID REFERENCES model_versions,
  var_name TEXT,
  lo NUMERIC,
  hi NUMERIC,
  fit_pred_year_end INT,
  PRIMARY KEY (model_version_id, var_name)
)

-- FRS-ADM-06: PCA artifacts
pca_artifacts (
  model_version_id UUID REFERENCES model_versions,
  k_components INT,
  evr JSONB,              -- Explained Variance Ratio
  eigenvalues JSONB,
  omega JSONB,            -- PCA weights
  loadings JSONB,         -- Component loadings
  kmo_overall NUMERIC,
  kmo_min NUMERIC,
  bartlett_chi2 NUMERIC,
  bartlett_pval NUMERIC,
  PRIMARY KEY (model_version_id, k_components)
)

-- FRS-ADM-07: Index scores
index_scores (
  model_version_id UUID REFERENCES model_versions,
  firm_id TEXT,
  year INT,
  pc1 NUMERIC,
  pc2 NUMERIC,
  pc3 NUMERIC,
  p_t NUMERIC,            -- Σ omega*PC
  label_t INT,            -- 1(P_t > 0)
  PRIMARY KEY (model_version_id, firm_id, year)
)

-- FRS-ADM-08: Forecast dataset
forecast_dataset (
  model_version_id UUID REFERENCES model_versions,
  firm_id TEXT,
  pred_year INT,          -- YEAR + 1
  x1_roa_winsor NUMERIC,
  x2_roe_winsor NUMERIC,
  x3_roc_winsor NUMERIC,
  x4_eps_winsor NUMERIC,
  x5_npm_winsor NUMERIC,
  label_t1 INT,           -- shift(Label_t, -1)
  split TEXT,             -- 'train' or 'test'
  PRIMARY KEY (model_version_id, firm_id, pred_year)
)

-- FRS-ADM-09: Predictions
predictions (
  model_version_id UUID REFERENCES model_versions,
  model_name TEXT,        -- 'XGBoost', 'SVM', 'RandomForest'
  firm_id TEXT,
  pred_year INT,
  probability NUMERIC,
  pred_label INT,
  PRIMARY KEY (model_version_id, model_name, firm_id, pred_year)
)

-- FRS-ADM-09: Model performance
model_performance (
  model_version_id UUID REFERENCES model_versions,
  model_name TEXT,
  spec TEXT,              -- 'MAIN', 'ROB A', 'ROB B'
  accuracy NUMERIC,
  f1_score NUMERIC,
  auc_score NUMERIC,
  baseline_accuracy NUMERIC,
  confusion_matrix JSONB, -- [[TN, FP], [FN, TP]]
  roc_points JSONB,       -- [{fpr, tpr}, ...]
  PRIMARY KEY (model_version_id, model_name, spec)
)

-- FRS-ADM-10: Robustness summary
robustness_summary (
  model_version_id UUID REFERENCES model_versions,
  spec TEXT,              -- 'MAIN', 'ROB A', 'ROB B'
  k_components INT,
  threshold_rule TEXT,    -- 'P_t>0', 'P_t>median'
  best_model TEXT,
  best_f1 NUMERIC,
  train_n INT,
  test_n INT,
  PRIMARY KEY (model_version_id, spec)
)
```

### User Tables (RLS Protected)
```sql
watchlists (
  watchlist_id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  name TEXT,
  created_at TIMESTAMP,
  RLS: user_id = auth.uid()
)

watchlist_items (
  item_id UUID PRIMARY KEY,
  watchlist_id UUID REFERENCES watchlists,
  firm_id TEXT,
  added_at TIMESTAMP,
  RLS: watchlist.user_id = auth.uid()
)

alerts (
  alert_id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  firm_id TEXT,
  alert_type TEXT,        -- 'probability_below', 'score_below', 'percentile_below'
  threshold NUMERIC,
  enabled BOOLEAN,
  last_triggered TIMESTAMP,
  RLS: user_id = auth.uid()
)
```

---

## 🔌 API Endpoints (SRS 2.5)

### Public Endpoints
```
GET  /model-versions
     → List all model versions

GET  /screener
     ?year=2023
     &exchange=HOSE
     &industry=Banking
     &min_score=0
     &min_probability=0.5
     &sort=score_desc
     &page=1
     &page_size=20
     &model_version=uuid
     &model_name=XGBoost
     → Paginated company list with filters

GET  /company/{ticker}/overview
     ?year=2023
     &model_version=uuid
     &model_name=XGBoost
     → Score, probability, top 3 drivers

GET  /company/{ticker}/history
     ?from_year=2019
     &to_year=2023
     &model_version=uuid
     → Time-series scores, proxies

GET  /company/{ticker}/drivers
     ?year=2023
     &model_version=uuid
     &model_name=XGBoost
     → Full proxy table + YoY delta

GET  /how-it-works
     ?model_version=uuid
     → Pipeline steps explanation

GET  /performance
     ?model_version=uuid
     → Tables 7-9, ROC curves, confusion matrix

GET  /robustness
     ?model_version=uuid
     → Table 9 (MAIN/ROB A/ROB B comparison)
```

### Authenticated Endpoints (JWT Required)
```
POST /watchlists
     {name: "My Watchlist"}
     → Create watchlist

GET  /watchlists
     → User's watchlists

POST /watchlist-items
     {watchlist_id, firm_id}
     → Add to watchlist

DELETE /watchlist-items/{item_id}
     → Remove from watchlist

POST /alerts
     {firm_id, alert_type, threshold}
     → Create alert

GET  /alerts
     → User's alerts

PATCH /alerts/{alert_id}
     {enabled: false}
     → Update alert
```

### Admin Endpoints (Secret Required)
```
POST /admin/import/financial
     multipart/form-data: file (Excel)
     → Upsert financial_raw

POST /admin/import/company-master
     multipart/form-data: file (Excel)
     → Upsert company_master

POST /admin/run-pipeline
     {recompute: false}
     → Run batch pipeline (Steps A-J)

POST /admin/publish-model-version
     {version_name: "v1.0"}
     → Create new model_version_id
```

---

## ⚙️ Batch Pipeline (SRS 2.4)

### Pipeline Steps (Idempotent)

```
Step A: Upsert financial_raw
  ↓
Step B: Upsert company_master
  ↓
Step C: Compute proxies + is_complete → Upsert proxies
  ↓
Step D: Create model_version
  ↓
Step E: Fit winsor bounds (YEAR≤2019) → Insert winsor_bounds
  ↓
Step F: Fit scaler/PCA/KMO/Bartlett → Insert pca_artifacts
  ↓
Step G: Transform PCs → Compute P_t/Label_t → Upsert index_scores
  ↓
Step H: Build forecast_dataset (X(t)→Label(t+1)) → Upsert forecast_dataset
  ↓
Step I: Train XGBoost/SVM/RF → Upsert predictions + model_performance
  ↓
Step J: Run robustness (MAIN/ROB A/ROB B) → Upsert robustness_summary
```

### Null Handling Rules

**FRS-RULE-01**: Raw data unchanged (nulls allowed)

**FRS-RULE-02**: Proxy calculation
```python
def safe_div(num, denom):
    if denom == 0 or pd.isna(denom):
        return np.nan
    return num / denom

# Compute proxies
ni_used = ni_p if not pd.isna(ni_p) else ni_at
x1_roa = safe_div(ni_used, ta)
x2_roe = safe_div(ni_used, eq_p)
x3_roc = safe_div(ni_used, sh_iss * PAR_VALUE)
x4_eps = eps_b
x5_npm = safe_div(ni_used, rev)

# Replace inf with NaN
df.replace([np.inf, -np.inf], np.nan, inplace=True)
```

**FRS-RULE-03**: is_complete flag
```python
is_complete = (
    ~pd.isna(x1_roa) &
    ~pd.isna(x2_roe) &
    ~pd.isna(x3_roc) &
    ~pd.isna(x4_eps) &
    ~pd.isna(x5_npm)
)
```

**FRS-RULE-04**: Leakage-safe split
```python
# Fit on TRAIN predictors only
train_mask = (df['YEAR'] <= 2019) & (df['is_complete'])
winsor_bounds = fit_winsor(df[train_mask])

# Split by label-year (target year)
df['target_year'] = df['YEAR'] + 1
train = df[df['target_year'] <= 2020]  # predictor years ≤ 2019
test = df[df['target_year'].isin([2021, 2022, 2023, 2024])]  # predictor years 2020-2023
```

---

## 🔒 Security (SRS 2.6)

### Authentication
- Supabase Auth (JWT tokens)
- Backend verifies JWT on protected routes

### Row Level Security (RLS)
```sql
-- Watchlists: Only owner can access
CREATE POLICY watchlist_policy ON watchlists
  USING (user_id = auth.uid());

-- Alerts: Only owner can access
CREATE POLICY alerts_policy ON alerts
  USING (user_id = auth.uid());
```

### CORS
- Allow only Vercel domain: `https://profitpulse.vercel.app`
- Localhost for development: `http://localhost:5173`

### Secrets
- Environment variables (not hard-coded)
- `.env` excluded from git

---

## 📊 Non-Functional Requirements (SRS 2.7)

### Performance
- Screener: Pagination required (no full table scans)
- Cache: Server-side cache for `/performance`, `/how-it-works`, `/model-versions`
- Indexes:
  - `index_scores(firm_id, year)`
  - `predictions(firm_id, pred_year)`
  - `company_master(exchange_name, gics_industry_name)`

### Reliability
- Missing scores/probabilities → Display "N/A" (no crash)
- API errors → Return friendly message + status code

### Shareability
- Deep-link support: URL contains ticker/year/model_version/spec
- Example: `/company/FPT?year=2023&model_version=abc123&model_name=XGBoost`

---

## 🧪 Testing (SRS 2.10)

### Unit Tests
- `safe_div()` behavior
- Winsor bounds calculation
- Label-year split logic

### Integration Tests
- Pipeline end-to-end → Verify all output tables created
- API endpoints → Response schema validation

### Security Tests
- RLS enforcement → Cross-user access blocked
- JWT validation → Invalid tokens rejected

### Regression Tests
- Tables 7-9 match notebook results
- ROC curves match expected FPR/TPR

---

## 🚀 Deployment (SRS 2.11)

### Vercel (Frontend)
- Build: `npm run build`
- Env vars: `VITE_API_URL`, `VITE_SUPABASE_URL`

### Render (Backend)
- Runtime: Python 3.12
- Start: `gunicorn app:app`
- Env vars: `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, `FLASK_ENV`

### Supabase
- Migrations: Apply schema DDL
- RLS policies: Enable for user tables

---

## ✅ Definition of Done (SRS 2.12)

System is complete when:

1. ✅ Batch pipeline creates all tables (proxies → predictions → robustness_summary)
2. ✅ Web queries pre-computed data (no model re-run)
3. ✅ User journey 1 works: Home → Search → Company → View score/probability/drivers
4. ✅ User journey 2 works: Screener → Filter → Company → Compare
5. ✅ Watchlist/alerts functional (CRUD + RLS)
6. ✅ Deep-link preserves state
7. ✅ All SRS 2.5 endpoints implemented
8. ✅ Tables 7-9 match notebook

---

**Document Version**: 1.0  
**Last Updated**: March 4, 2026
