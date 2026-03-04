# 🏗️ System Architecture

Complete technical design and database schema for ProfitPulse.

## System Components

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend Layer                       │
│            React 18 + Vite Framework                    │
│  ├─ Pages: Home, Screener, Company, Compare, Alerts     │
│  ├─ Services: API calls via axios                       │
│  └─ UI: Tailwind CSS, Lucide Icons                      │
└────────────────────┬────────────────────────────────────┘
                     │ REST API (HTTPS)
                     │ https://profitpulse-ihv0.onrender.com
                     ▼
┌─────────────────────────────────────────────────────────┐
│                   Backend Layer                         │
│           Flask 3.0 + Python 3.12                       │
│  ├─ API Routes: 10 endpoints                            │
│  ├─ Business Logic: ML models, data processing          │
│  ├─ Database: Supabase connection                       │
│  └─ Security: CORS, CSP, JWT validation                 │
└────────────────────┬────────────────────────────────────┘
                     │ SQL Queries
                     │ supabase-py client
                     ▼
┌─────────────────────────────────────────────────────────┐
│                Data Layer                               │
│        Supabase PostgreSQL Database                     │
│  ├─ 15 Tables, 38K+ rows                                │
│  ├─ Service role auth (backend only)                    │
│  └─ Real-time subscriptions (optional)                  │
└─────────────────────────────────────────────────────────┘
```

## Database Schema

### 1. Companies Table
```sql
companies:
  - id: UUID (PK)
  - ticker: VARCHAR(10) UNIQUE -- Stock code (VNM, FPT, etc.)
  - company_name: VARCHAR(100)
  - industry: VARCHAR(50)
  - market_cap: BIGINT
  - created_at: TIMESTAMP
  - updated_at: TIMESTAMP
```
**Records:** 628 Vietnamese stock companies

### 2. Financial Data Table
```sql
financial_raw:
  - id: UUID (PK)
  - ticker: VARCHAR(10) (FK → companies)
  - year: INT -- Report year
  - revenue: BIGINT
  - net_income: BIGINT
  - total_assets: BIGINT
  - total_equity: BIGINT
  - roa: FLOAT -- Return on Assets
  - npm: FLOAT -- Net Profit Margin
  - roe: FLOAT -- Return on Equity
  - debt_to_equity: FLOAT
  - created_at: TIMESTAMP
```
**Records:** ~1,000 financial records (multiple years per company)

### 3. Index Scores Table
```sql
index_scores:
  - id: UUID (PK)
  - ticker: VARCHAR(10) (FK → companies)
  - year: INT
  - p_t: FLOAT -- ProfitScore from PCA model
  - profit_score: FLOAT -- Alias for p_t
  - risk_level: VARCHAR(20) -- "High", "Low", "Borderline"
  - score_date: TIMESTAMP
  - created_at: TIMESTAMP
```
**Records:** ~9,725 scores (historical and current)

### 4. Predictions Table
```sql
predictions:
  - id: UUID (PK)
  - ticker: VARCHAR(10) (FK → companies)
  - model_name: VARCHAR(50) -- "xgboost", "svm", "rf"
  - prediction: FLOAT -- Predicted profit score
  - confidence: FLOAT -- 0.0 to 1.0
  - prediction_date: TIMESTAMP
  - created_at: TIMESTAMP
```
**Records:** ~3,000+ predictions from multiple models

### 5. Additional Tables
- `watchlists` - User watchlists (future feature)
- `alerts` - User alerts (future feature)
- `model_metadata` - Model versions and performance
- Plus 9 more for historical data, artifacts, etc.

## API Endpoints

### Health & Metadata

**GET /health**
```json
{
  "status": "ok",
  "database": "Supabase PostgreSQL",
  "message": "ProfitPulse API is running",
  "version": "1.0.0"
}
```

**GET /api/meta**
```json
{
  "companies": ["SMB", "NTC", "PVP", "NVL", "NBW", ...],
  "total_companies": 628,
  "latest_data_year": 2023
}
```

### Company Data

**GET /api/company/{ticker}**
```json
{
  "ticker": "VNM",
  "company_name": "Vinamilk",
  "financial": [
    {"year": 2023, "revenue": 100000000000, "net_income": 5000000000, ...},
    {"year": 2022, "revenue": 95000000000, ...}
  ],
  "index_scores": [
    {"year": 2023, "profit_score": 0.85, "risk_level": "Low"},
    {"year": 2022, "profit_score": 0.78, ...}
  ],
  "predictions": [
    {"model": "xgboost", "prediction": 0.87, "confidence": 0.92}
  ]
}
```

**GET /api/companies?limit=50&offset=0**
```json
[
  {"ticker": "SMB", "company_name": "Sao Mai", ...},
  {"ticker": "NTC", "company_name": "...", ...}
]
```

### Screening & Analysis

**GET /api/screener?year=2023&min_score=-0.5&risk_high=true&limit=100**
```json
{
  "query_params": {year: 2023, ...},
  "results": [
    {"ticker": "ABC", "profit_score": 0.5, "risk_level": "High"},
    ...
  ],
  "total_count": 45
}
```

**POST /api/compare**
```json
{
  "tickers": ["VNM", "FPT", "VCB"],
  "year": 2023
}
// Returns side-by-side comparison
```

**GET /api/summary?ticker=VNM&year=2023**
```json
{
  "company": "Vinamilk",
  "score_evolution": [...],
  "key_metrics": {...},
  "risk_assessment": {...},
  "recommendations": [...]
}
```

## ML Models

### PCA (Principal Component Analysis)
- **Input:** Financial metrics (10+ features)
- **Output:** ProfitScore (-1.0 to +1.0)
- **Model file:** `artifacts/pca_model.pkl`
- **Updated:** Annually

### XGBoost Classifier
- **Input:** Historical profit scores
- **Output:** Profit prediction (binary classification)
- **Hyperparameters:** max_depth=5, learning_rate=0.1, n_estimators=100
- **Accuracy:** ~82%

### Support Vector Machine (SVM)
- **Input:** Financial metrics
- **Output:** Risk classification (High/Low)
- **Kernel:** RBF
- **Accuracy:** ~78%

### Random Forest
- **Input:** Financial features
- **Output:** Ensemble profit prediction
- **Trees:** 100
- **Accuracy:** ~80%

## Authentication & Security

### Backend Security
- **CORS:** Enabled for verified origins
- **CSP:** Content Security Policy enforced
- **Supabase:** Service role key (backend only)
- **Environment:** Production mode on Render

### Frontend Security
- **HTTPS:** All API calls encrypted
- **CSP:** Strict policy + Vercel Live support
- **Cookie-less:** Stateless API calls
- **CORS:** Respects backend CORS headers

### Database Security
- **Auth:** Service role key (requires secret)
- **Encryption:** In-transit (HTTPS) + at-rest (Supabase)
- **RLS:** Row-level security available (not yet configured)
- **Backups:** Automatic daily backups (Supabase)

## Data Processing Pipeline

### 1. Data Collection
- Source: Financial databases, stock exchanges
- Format: CSV/Excel → Pandas DataFrame
- Validation: Type checking, null handling

### 2. Preprocessing
```python
# Normalize financial metrics
X_scaled = StandardScaler().fit_transform(financial_data)

# Handle missing values
imputer = SimpleImputer(strategy='mean')
X_imputed = imputer.fit_transform(X_scaled)

# Feature selection
X_final = selector.transform(X_imputed)
```

### 3. PCA Transformation
```python
# Reduce to principal components
pca = PCA(n_components=3)
X_pca = pca.fit_transform(X_final)

# Generate score (-1 to +1)
profit_score = X_pca[:, 0]  # First principal component
```

### 4. ML Predictions
```python
# Train multiple models
xgboost = XGBClassifier(...)
svm = SVC(...)
rf = RandomForestClassifier(...)

# Generate predictions
predictions = [
    xgboost.predict(X_pca),
    svm.predict(X_pca),
    rf.predict(X_pca)
]
```

### 5. Data Storage
```python
# Save to Supabase
for ticker, data in company_data.items():
    db.insert('financial_raw', data)
    db.insert('index_scores', scores)
    db.insert('predictions', preds)
```

## Performance Specifications

### API Response Times
| Endpoint | Response Time | Data Size |
|----------|---------------|-----------|
| /health | <50ms | 100B |
| /api/meta | <100ms | 20KB |
| /api/company/{ticker} | <200ms | 50KB |
| /api/companies | <300ms | 100KB |
| /api/screener | 200-500ms | 50-200KB |
| /api/summary | <300ms | 30KB |

### Database
- Queries: <200ms for indexed columns
- Writes: ~100ms per record
- Batch insert: 1000 records in ~5 seconds

### Frontend
- Build size: ~450KB (gzipped: ~150KB)
- Initial load: <3 seconds
- Page navigation: <500ms

## Data Flow Diagram

```
User: Browser
  ↓ (HTTP Request)
  ├─→ Vercel CDN (Static files)
  └─→ Frontend React App
        ↓ (API Call: axios)
Backend: Render Flask
  ├─ Route Handler
  ├─ Business Logic
  └─ ML Model Inference
        ↓ (SQL Query)
Database: Supabase PostgreSQL
  ├─ Query Table
  └─ Return Results
        ↑ (JSON Response)
Backend: Format Response
  ↑ (HTTP Response)
Frontend: Process Data
  ↑ (Render UI)
User: View Result
```

## Development Stack Summary

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| Frontend | React | 18.x | UI framework |
| | Vite | 4.x | Build tool |
| | Tailwind CSS | 3.x | Styling |
| Backend | Flask | 3.0 | Web framework |
| | Python | 3.12 | Language |
| Database | PostgreSQL | 14+ | Database |
| | Supabase | - | DB host |
| ML | scikit-learn | 1.3.2 | ML library |
| | XGBoost | 2.0.3 | Gradient boosting |
| Deployment | Vercel | - | Frontend host |
| | Render | - | Backend host |
| | Supabase | - | Database host |

---

**Last Updated:** March 2026  
**Version:** 1.0.1  
**Status:** ✅ Production Stable
