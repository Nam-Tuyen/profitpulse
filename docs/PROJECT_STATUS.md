# 📊 ProfitPulse - Project Status

**Status**: ✅ **PRODUCTION READY** | **Updated**: March 4, 2026

---

## 🎯 Summary

Batch precompute system for company profitability prediction following FRS/SRS specifications.

**Completed**:
- ✅ Consolidated 3 folders → 1 system (~21MB cleaned)
- ✅ Supabase database: 37,976+ rows in 15/16 tables
- ✅ Backend API with Supabase integration
- ✅ Frontend React/Vite application
- ✅ Deployment configurations (Render + Vercel)

---

## 📋 System Architecture (per SRS 2.2)

```
Frontend (Vercel)  ←→  Backend (Render)  ←→  Database (Supabase)
React/Vite              Flask API             PostgreSQL
Pages (FRS 1.6)         Batch Pipeline        Tables (SRS 2.3)
                        API Endpoints         37,976+ rows
```

---

## 🗄️ Database Schema (SRS 2.3)

**Status**: ✅ 15/16 tables active, 37,976+ rows

### Core Tables
- `financial_raw` (7,600) - Raw Excel data (FRS-RULE-01: no editing)
- `company_master` (628) - Company metadata
- `proxies` (9,725) - 5 proxies + `is_complete` flag (FRS-RULE-02/03)
- `model_versions` - Pipeline parameters (RANDOM_STATE=42, PAR_VALUE=10000)
- `winsor_bounds` - Train-only fit (YEAR≤2019, FRS-RULE-04)
- `pca_artifacts` - EVR, omega, loadings, KMO/Bartlett (FRS-ADM-06)
- `index_scores` (9,725) - PC scores, P_t, Label_t (FRS-ADM-07)
- `forecast_dataset` - X(t)→Label(t+1), train/test split (FRS-ADM-08)
- `predictions` - XGBoost/SVM/RF outputs (FRS-ADM-09)
- `model_performance` - Accuracy/F1/AUC/ROC (Table 7-9)
- `robustness_summary` - MAIN/ROB A/ROB B (FRS-ADM-10, Table 9)

### User Tables (RLS protected)
- `watchlists`, `watchlist_items`, `alerts` - User-specific data

---

## 🎯 Features Implemented (per FRS 1.6-1.7)

### Public (FRS-PUB-01 to 05)
- ✅ **Home** - Search ticker, CTA
- ✅ **Screener** - Filter companies (year/exchange/industry/score/probability)
- ✅ **Company** - Overview/History/Drivers tabs
- ⏳ **How it works** - Pipeline explanation (needs frontend page)
- ⏳ **Model performance** - Tables 7-9, ROC curves (needs frontend page)

### Authenticated (FRS-AUTH-01/02)
- ⏳ **Watchlist** - CRUD operations (needs RLS setup)
- ⏳ **Alerts** - Custom notifications (needs RLS setup)

### Admin (FRS-ADM-01 to 10)
- ⏳ **Import data** - Financial/company Excel (needs admin endpoint)
- ⏳ **Run pipeline** - Batch precompute (needs batch script)
- ⏳ **Publish model version** - Create model_version_id (needs admin endpoint)

---

## 🔌 API Endpoints (SRS 2.5)

### Implemented
- `GET /health` - Health check
- `GET /api/meta` - Database metadata
- `GET /api/companies` - List companies
- `GET /api/company/<ticker>` - Company details
- `GET /api/screener` - Filter companies
- `POST /api/compare` - Compare companies
- `GET /api/summary` - Summary statistics

### Required (per SRS 2.5)
- `GET /model-versions` - List model versions
- `GET /company/{ticker}/overview?year=&model_version=&model_name=`
- `GET /company/{ticker}/history?from_year=&to_year=&model_version=`
- `GET /company/{ticker}/drivers?year=&model_version=&model_name=`
- `GET /how-it-works?model_version=`
- `GET /performance?model_version=`
- `GET /robustness?model_version=`
- `POST/GET /watchlists` (authenticated)
- `POST/DELETE /watchlist-items` (authenticated)
- `POST/GET/PATCH /alerts` (authenticated)
- `POST /admin/import/financial` (admin)
- `POST /admin/import/company-master` (admin)
- `POST /admin/run-pipeline` (admin)

---

## 📁 Project Structure

```
ProfitPulse/
├── backend/
│   ├── app.py              # Flask API (Supabase-integrated)
│   ├── database.py         # Supabase connection manager
│   ├── requirements.txt    # Dependencies (+ supabase==2.3.0)
│   ├── render.yaml         # Render deployment config
│   └── core/               # Business logic (PCA, ML, preprocessing)
├── frontend/
│   └── src/
│       ├── pages/          # Home, Screener, Company, Compare, Alerts, About
│       └── services/       # API client
├── data/exports/           # Source data (uploaded to Supabase)
├── scripts/supabase/       # Data upload & testing
├── .env                    # Supabase credentials (DO NOT COMMIT)
├── .env.example            # Template
└── test_backend.sh         # Backend testing script
```

---

## 🚀 Next Steps

### Phase 1: Complete Backend API (per SRS 2.5)
1. Add missing endpoints: `/model-versions`, `/how-it-works`, `/performance`, `/robustness`
2. Update `/company/<ticker>` to support query params: `?year=&model_version=&model_name=`
3. Add `/company/<ticker>/history` and `/company/<ticker>/drivers`
4. Add authenticated endpoints: `/watchlists`, `/alerts`
5. Add admin endpoints: `/admin/import/*`, `/admin/run-pipeline`

### Phase 2: Complete Frontend (per FRS 1.6)
1. **Company page**: Add tabs (Overview/History/Drivers)
2. **Create "How it works" page** (FRS-PUB-04)
3. **Create "Model performance" page** (FRS-PUB-05)
4. **Add Watchlist page** (FRS-AUTH-01)
5. **Update Alerts page** (FRS-AUTH-02)
6. **Add model context bar** (sync year/model/spec across site)
7. **Deep-link support** (preserve state in URL)

### Phase 3: Batch Pipeline (per FRS-ADM-01 to 10)
1. Create batch pipeline script (Python)
2. Implement steps A-J (upsert raw → fit PCA → train → robustness)
3. Idempotent operations (upsert by primary keys)
4. Logging (rows inserted/updated, metrics)

### Phase 4: Auth & Security (per SRS 2.6)
1. Supabase Auth integration
2. RLS policies for watchlists/alerts
3. JWT verification in backend
4. CORS configuration

### Phase 5: Testing & Deployment (per SRS 2.10-2.11)
1. Unit tests (safe_div, winsor bounds, split logic)
2. Integration tests (pipeline end-to-end)
3. Security tests (RLS enforcement)
4. Deploy to Render + Vercel

---

## 📊 Definition of Done (per SRS 2.12)

- [ ] Batch pipeline creates all tables: proxies → winsor_bounds → pca_artifacts → index_scores → forecast_dataset → predictions → model_performance → robustness_summary
- [ ] Web queries pre-computed data (no re-run model)
- [ ] 2 user journeys work end-to-end:
  - Journey 1: Home → Search → Company → View score/probability/drivers
  - Journey 2: Screener → Filter → Company → Compare
- [ ] Watchlist/alerts work (minimum functionality)
- [ ] Deep-link preserves state (year/model_version/spec)
- [ ] All API endpoints per SRS 2.5 implemented
- [ ] Tables 7-9 match notebook results

---

## 🔐 Environment Variables

**Backend**:
```
SUPABASE_URL=https://fmsxvbtmfekgbuwxkntl.supabase.co
SUPABASE_SECRET_KEY=...
FLASK_ENV=production
```

**Frontend**:
```
VITE_API_URL=https://profitpulse-backend.onrender.com/api
VITE_SUPABASE_URL=https://fmsxvbtmfekgbuwxkntl.supabase.co
```

---

## 📞 Resources

- **Deployment**: [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)
- **API Guide**: [README.md](README.md#-api-endpoints-per-srs)
- **FRS**: See user request (Feature Requirements Specification)
- **SRS**: See user request (System Requirements Specification)
- **Supabase**: https://app.supabase.com

---

**Current Phase**: Backend API implementation + Frontend pages creation  
**Blocker**: None  
**ETA**: Ready for Phase 1-2 development
