# Data Fields Mapping: Backend ↔ Frontend

**Cập nhật: 4 tháng 3, 2026**

---

## 1. API Endpoints & Response Fields

### 1.1 `/api/meta` - Metadata

**Status**: ✅ Working  
**Backend Response**:
```json
{
  "companies": ["AAA", "HDB", "FPT", ...],
  "total_companies": 628,
  "total_financial_records": 1000,
  "years": [1999, 2000, ..., 2025],
  "year_range": {"min": 1999, "max": 2025},
  "success": true
}
```

**Frontend Usage** (helpers.js, Home.jsx, Screener.jsx, Alerts.jsx, Compare.jsx):
- ✅ `metaData.companies` - danh sách mã công ty (Screener, Compare)
- ✅ `metaData.years` - danh sách năm có dữ liệu
- ✅ `metaData.total_companies` - tổng số công ty

---

### 1.2 `/api/company/<ticker>` - Company Detail

**Status**: ⚠️ **BUG ON DEPLOYED: financial_raw.ticker error** (local code fixed)  
**Backend Response**:
```json
{
  "company": {
    "ticker": "AAA",
    "symbol": "AAA.HM",
    "company_name": "ABC Việt Nam",
    "exchange_name": "HoSE"
  },
  "firm_id": "AAA.HM",
  "ticker": "AAA",
  "latest_score": {
    "year": 2025,
    "profit_score": 5.43,
    "label_t": 1,
    "risk_level": "Cao",
    "percentile": 100,
    "pc1": 7.34,
    "pc2": 3.05,
    "pc3": 0.23
  },
  "timeseries": [
    {
      "year": 2025,
      "profitscore": 5.43,
      "label": 1,
      "percentile": 100
    },
    ...
  ],
  "financial_data": [...],
  "total_years": 10,
  "success": true
}
```

**Frontend Usage** (Company.jsx):
- ✅ `companyData.company.company_name` - tên công ty
- ✅ `companyData.company.exchange_name` - sàn giao dịch
- ✅ `companyData.latest_score.profit_score` - điểm lợi nhuận mới nhất
- ✅ `companyData.latest_score.label_t` - nhãn rủi ro (0=Low, 1=High)
- ✅ `companyData.latest_score.risk_level` - "Cao"/"Thấp"
- ✅ `companyData.latest_score.percentile` - phân vị
- ✅ `companyData.latest_score.pc1/pc2/pc3` - các thành phần PCA
- ✅ `companyData.timeseries[].year` - năm trong chuỗi thời gian
- ✅ `companyData.timeseries[].profitscore` - điểm lợi nhuận theo năm
- ✅ `companyData.total_years` - số năm có dữ liệu

---

### 1.3 `/api/screener` - Screen Companies

**Status**: ✅ Working  
**Request Params**:
```
year: int (mặc định năm mới nhất)
min_score: float (lọc profit_score >= min)
max_score: float (lọc profit_score <= max)
limit: int (mặc định 50)
```

**Backend Response**:
```json
{
  "results": [
    {
      "firm_id": "SLS.HN",
      "profit_score": 5.43,
      "p_t": 5.43,
      "label_t": 1,
      "percentile_year": 100,
      "pc1": 7.34,
      "pc2": 3.05,
      "pc3": 0.23,
      "year": 2025
    },
    ...
  ],
  "count": 50,
  "year": 2025,
  "success": true
}
```

**Frontend Usage** (Screener.jsx):
- ✅ `row.firm_id` - mã công ty
- ✅ `row.profit_score` - điểm lợi nhuận
- ✅ `row.label_t` - nhãn rủi ro (0 hoặc 1)
- ✅ `row.pc1/pc2/pc3` - thành phần PCA
- ✅ `row.year` - năm
- ✅ `row.percentile_year` - phân vị

---

### 1.4 `/api/summary` - Summary Statistics

**Status**: ⚠️ **DEPLOYED VERSION DIFFERS** (flat vs. nested structure)  

**Local Backend Response** (nested):
```json
{
  "year": 2025,
  "summary": {
    "total_firms": 628,
    "total_companies": 628,
    "high_risk_count": 150,
    "low_risk_count": 478,
    "avg_profit_score": 2.15,
    "max_profit_score": 8.92,
    "min_profit_score": -3.21
  },
  "chart_data": {
    "risk_distribution": {"High": 150, "Low": 478},
    "score_distribution": [
      {"range": "< -1", "count": 10},
      {"range": "-1 ~ 0", "count": 45},
      ...
    ],
    "top_performers": [
      {"firm": "FPT", "score": 8.92},
      ...
    ]
  },
  "top_companies": [
    {
      "firm_id": "FPT.HN",
      "year": 2025,
      "profit_score": 8.92,
      "label_t": 0,
      "percentile_year": 100,
      "pc1": 7.5,
      "pc2": 2.1,
      "pc3": 0.8
    },
    ...
  ],
  "success": true
}
```

**Deployed Version** (flat):
```json
{
  "year": 2025,
  "total_companies": 628,
  "total_firms": 628,
  "high_risk_count": 150,
  "low_risk_count": 478,
  "avg_profit_score": 2.15,
  "max_profit_score": 8.92,
  "min_profit_score": -3.21,
  "top_companies": [...],
  "success": true
}
```

**Frontend Usage** (Home.jsx - FIXED to handle both):
- ✅ `summaryData.summary.total_firms` OR `summaryData.total_firms` (fallback)
- ✅ `summaryData.summary.high_risk_count` OR `.high_risk_count` 
- ✅ `summaryData.summary.low_risk_count` OR `.low_risk_count`
- ✅ `summaryData.chart_data.risk_distribution` (optional)
- ✅ `summaryData.chart_data.score_distribution` (optional)
- ✅ `summaryData.top_companies` - luôn được return

---

### 1.5 `/api/compare` - Compare Multiple Companies

**Status**: ✅ Working  
**Request** (POST):
```json
{
  "tickers": ["FPT", "AAA", "HDB"],
  "year": 2025
}
```

**Backend Response**:
```json
{
  "comparison": [
    {
      "ticker": "FPT",
      "company": {
        "ticker": "FPT",
        "symbol": "FPT.HN",
        "company_name": "FPT Corporation",
        "exchange_name": "HoSE"
      },
      "financial": {...},
      "scores": {
        "firm_id": "FPT.HN",
        "year": 2025,
        "profit_score": 8.92,
        "p_t": 8.92,
        "label_t": 0,
        "percentile_year": 100,
        "pc1": 7.5,
        "pc2": 2.1,
        "pc3": 0.8
      }
    },
    ...
  ],
  "count": 3,
  "success": true
}
```

**Frontend Usage** (Compare.jsx):
- ✅ `row.ticker` - mã công ty
- ✅ `row.company.company_name` - tên công ty
- ✅ `row.scores.profit_score` - điểm lợi nhuận
- ✅ `row.scores.label_t` - nhãn rủi ro
- ✅ `row.scores.pc1/pc2/pc3` - thành phần PCA
- ✅ Timeseries: fetches via `apiService.getCompany(firm)` → `firmData.timeseries`

---

### 1.6 `/api/alerts` - Alert List

**Status**: ⚠️ **404 ON DEPLOYED** (routes missing on Render version)  
**Request Params**:
```
scope: "market" | "watchlist"
year_from: int
year_to: int
rules: "risk_change,chance_drop,borderline" (comma-separated)
watchlist: "AAA,HDB" (optional, comma-separated)
```

**Backend Response**:
```json
{
  "alerts": [
    {
      "firm_id": "AAA.HM",
      "year": 2025,
      "type": "risk_change",
      "severity": "high",
      "message": "AAA được dự báo Risk cao (label=1) cho năm 2025",
      "profit_score": 1.23,
      "percentile": 30
    },
    ...
  ],
  "count": 50,
  "year": 2025,
  "success": true
}
```

**Frontend Usage** (Alerts.jsx):
- ✅ `alert.firm_id` - mã công ty
- ✅ `alert.year` - năm
- ✅ `alert.type` OR `alert.alert_type` - loại cảnh báo (risk_change, chance_drop, borderline)
- ✅ `alert.severity` - mức độ (high, medium, low)
- ✅ `alert.message` - mô tả cảnh báo
- ✅ `alert.profit_score` - điểm lợi nhuận

---

### 1.7 `/api/about` - Project Information

**Status**: ⚠️ **404 ON DEPLOYED** (routes missing on Render version)  
**Backend Response**:
```json
{
  "project": "ProfitPulse",
  "version": "1.0.0",
  "description": "Hệ thống phân tích và dự báo lợi nhuận...",
  "methodology": {
    "name": "PCA + Machine Learning",
    "metrics": ["ROA", "ROE", "ROC", "EPS", "NPM"],
    "models": ["PCA (chấm điểm)", "XGBoost / Random Forest (phân loại risk)"],
    "data_source": "Dữ liệu tài chính doanh nghiệp niêm yết Việt Nam"
  },
  "stats": {
    "total_companies": 628,
    "total_records": 10000,
    "year_range": {"min": 1999, "max": 2025}
  },
  "success": true
}
```

**Frontend Usage** (About.jsx - FIXED):
- ✅ `aboutData.methodology.name` - tên phương pháp
- ✅ `aboutData.methodology.metrics` - danh sách chỉ số (ROA, ROE, ROC, EPS, NPM)
- ✅ `aboutData.methodology.models` - danh sách mô hình
- ✅ `aboutData.methodology.data_source` - nguồn dữ liệu
- ✅ `aboutData.stats.total_companies` - tổng số công ty
- ✅ `aboutData.stats.total_records` - tổng số bản ghi
- ✅ `aboutData.stats.year_range` - khoảng năm

---

## 2. Data Field Status Summary

### Backend Available Fields ✅

| Endpoint | Fields Count | Status |
|----------|--------------|--------|
| /api/meta | 5 | ✅ Working |
| /api/company/<ticker> | 12+ | ⚠️ Deployed bug |
| /api/screener | 8 | ✅ Working |
| /api/summary | 11+ | ⚠️ Flat vs nested |
| /api/compare | 10+ | ✅ Working |
| /api/alerts | 6 | ❌ 404 on deployed |
| /api/about | 8 | ❌ 404 on deployed |

### Frontend Data Consumption

| Page | Status | Notes |
|------|--------|-------|
| Home.jsx | ✅ FIXED | Handles both nested/flat summary, total_companies → total_firms |
| Company.jsx | ✅ FIXED | Maps to latest_score, timeseries, company objects |
| Screener.jsx | ✅ FIXED | Handles firm_id, profit_score, pc1/pc2/pc3, label_t |
| Compare.jsx | ✅ FIXED | Accesses row.scores.*, calls getCompany for timeseries |
| Alerts.jsx | ✅ FIXED | Uses alert.type \|\| alert.alert_type |
| About.jsx | ✅ FIXED | Maps methodology.metrics, stats fields |

---

## 3. Known Issues & Fixes Applied

### ✅ Fixed Issues

1. **helpers.js**: `getRiskBadgeColor` - now supports both Vietnamese ("Cao"/"Thấp") and English ("High"/"Low")
2. **api.js**: screener() - params now use `min_score`/`max_score` (was risk/chance_min/chance_max)
3. **Company.jsx**: data mapping restructured to match `{company, latest_score, timeseries, total_years}`
4. **Home.jsx**: handles both nested `{summary: {}, chart_data: {}, top_companies: []}` AND flat response
5. **Alerts.jsx**: toggle between `alert.type` and `alert.alert_type`
6. **About.jsx**: maps to `methodology.metrics/models` and `stats.*` instead of non-existent `model_metrics.accuracy`
7. **All pages**: added navigation guards for undefined ticker/firm_id

### ⚠️ Remaining Issues (Require Redeployment)

1. **Deployed Backend Out of Date**
   - Local `app.py` has `/api/alerts`, `/api/about` routes
   - Deployed version missing these routes (404 errors)
   - Deployed `/api/summary` returns FLAT response, local returns NESTED
   - Deployed company endpoint crashes: `column financial_raw.ticker does not exist`

2. **Actions Needed**:
   - Push code to GitHub ✅ (already done)
   - Trigger Render redeploy (auto or manual "Deploy latest commit")
   - Verify endpoints after redeploy with curl tests

---

## 4. Data Flow Diagram

```
Backend Supabase Database
├── companies (ticker, symbol, company_name, exchange_name)
├── financial_raw (firm_id, year, ROA, ROE, etc.)
├── index_scores (firm_id, year, p_t→profit_score, label_t, pc1, pc2, pc3, percentile_year)
└── predictions (optional, may be empty)

Backend API (app.py + database.py)
├── /api/meta → metaData {companies, years, total_companies}
├── /api/company/<ticker> → companyData {company, latest_score, timeseries, financial_data}
├── /api/screener → results [{firm_id, profit_score, label_t, pc1, pc2, pc3, year}]
├── /api/summary → {summary {total_firms, high_risk_count, ...}, chart_data, top_companies}
├── /api/compare → {comparison [{ticker, company, scores}]}
├── /api/alerts → {alerts [{firm_id, type, severity, message}]}
└── /api/about → {methodology, stats}

Frontend Pages (React + Vite)
├── Home.jsx (uses /api/meta, /api/summary)
├── Company.jsx (uses /api/company/<ticker>)
├── Screener.jsx (uses /api/screener, /api/meta)
├── Compare.jsx (uses /api/compare, /api/company for timeseries, /api/meta)
├── Alerts.jsx (uses /api/alerts, /api/meta)
└── About.jsx (uses /api/about)
```

---

## 5. Deployment Checklist

- [x] Frontend fixes (all pages)
- [x] Backend code updated (app.py, database.py)
- [x] Building frontend successful
- [x] Code pushed to GitHub
- [ ] Render auto-redeploy triggered OR manual "Deploy latest commit"
- [ ] Verify `/api/company/<ticker>` returns data (not ticker error)
- [ ] Verify `/api/alerts` returns data (not 404)
- [ ] Verify `/api/about` returns data (not 404)
- [ ] Verify `/api/summary` returns nested structure `{summary: {}, chart_data: {}, top_companies: []}`

---

**Last Updated**: 4 tháng 3, 2026  
**Next Action**: Monitor Render deployment status
