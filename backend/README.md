# Backend README

## 📁 Cấu trúc Backend

```
backend/
├── main.py                 # 🎯 Main entrypoint (CLI)
├── pipeline.py             # Original modular pipeline
├── profitpulse_pipeline.py # ProfitPulse pipeline (leakage-safe) ⭐
├── api_server.py           # Flask API server
│
├── core/                   # Core ML modules
│   ├── data_loader.py         # Load & align panel data
│   ├── preprocessing.py       # Winsorize + Standardize (train-only)
│   ├── pca_profitscore.py     # PCA & ProfitScore calculation
│   ├── labeling.py            # Label generation (t+1)
│   ├── ml_models.py           # SVM/RF/XGB training
│   └── explanations.py        # Explanation generator
│
├── utils/                  # Utilities
│   └── cache_manager.py       # Cache query manager
│
├── api/                    # API routes (optional)
├── models/                 # Saved models (optional)
└── cache/                  # Cache directory (generated)
```

## 🚀 Quick Start

### Option 1: Using main.py (Recommended)

```bash
# 1. Run ProfitPulse pipeline (leakage-safe, recommended)
python backend/main.py pipeline --use-profitpulse --data Data.xlsx

# 2. Start API server
python backend/main.py serve --port 5000

# 3. Or run both at once
python backend/main.py all --use-profitpulse --data Data.xlsx --port 5000
```

### Option 2: Direct execution

```bash
# Run ProfitPulse pipeline directly
python backend/profitpulse_pipeline.py

# Or run original pipeline
python backend/pipeline.py --data Data.xlsx --train-year 2020

# Start API server
python backend/api_server.py
```

## 📊 Two Pipeline Options

### 1. **ProfitPulse Pipeline** (profitpulse_pipeline.py) ⭐ **Recommended**

**Features:**
- ✅ Leakage-safe 100% (fit on predictor year ≤ 2019)
- ✅ Build proxies (ROA, ROE, ROC, EPS, NPM) from raw data
- ✅ Complete app views (screener, company, alerts)
- ✅ Built-in explanations (rule-based)
- ✅ Single-file, easy to review

**Output:** `artifacts_profitpulse/` (6 files)

**When to use:**
- Need to build proxies from raw financial data
- Want 100% guarantee of no data leakage
- Need auto-generated app views

### 2. **Original Pipeline** (pipeline.py)

**Features:**
- ✅ Modular design (6 core modules)
- ✅ Easy to customize each step
- ✅ Already integrated with API server

**Output:** `backend/cache/` (3 files)

**When to use:**
- Data already has clean proxies
- Need to customize specific modules
- Prefer modular architecture

## 📡 API Endpoints

After running pipeline & starting server:

```bash
# Health check
GET http://localhost:5000/health

# Get metadata
GET http://localhost:5000/api/meta

# Screener
GET http://localhost:5000/api/screener?year=2021&risk=High

# Company details
GET http://localhost:5000/api/company/AAA?year=2021

# Compare companies
POST http://localhost:5000/api/compare
Body: {"tickers": ["AAA", "BBB"], "year": 2021}

# Summary stats
GET http://localhost:5000/api/summary?year=2021

# Top risk alerts
GET http://localhost:5000/api/alerts/top-risk?n=10
```

## 🔧 Configuration

### Pipeline Configuration

**ProfitPulse Pipeline:**
```python
# Edit profitpulse_pipeline.py
cfg = AppConfig(
    input_path="Data.xlsx",
    output_dir="artifacts_profitpulse",
    train_target_end_year=2020,
    test_target_years=(2021, 2022, 2023, 2024),
    preprocess_fit_pred_year=2019,  # Fit on year ≤ 2019
    default_model_name="XGBoost",    # or "SVM (RBF)", "Random forest"
)
```

**Original Pipeline:**
```python
# Edit pipeline.py or use CLI args
python backend/pipeline.py \
    --data Data.xlsx \
    --train-year 2020 \
    --test-year 2021 \
    --cache-dir backend/cache
```

### API Server Configuration

```python
# Edit api_server.py
CACHE_DIR = "backend/cache"  # or "artifacts_profitpulse"
DEBUG = False
PORT = 5000
```

## 📦 Cache Files

### ProfitPulse outputs (artifacts_profitpulse/):
- `company_view.parquet` - Company time-series
- `screener_2023.parquet` - Screener data
- `predictions_all.parquet` - All predictions
- `model_metrics.json` - Model performance
- `methodology_snapshot.json` - Preprocessing metadata
- `alerts_2016_2023.parquet` - Risk alerts

### Original pipeline outputs (backend/cache/):
- `predictions.parquet` - Predictions + explanations
- `profit_scores.parquet` - ProfitScore time-series
- `metadata.json` - Metrics + model info

## 🐛 Troubleshooting

### Issue: "No module named 'sklearn'"
```bash
pip install scikit-learn xgboost pandas numpy openpyxl
```

### Issue: "Data.xlsx not found"
Ensure Data.xlsx is in project root:
```bash
ls -lh Data.xlsx
```

### Issue: "Cache not found" errors from API
Run pipeline first:
```bash
python backend/main.py pipeline --use-profitpulse
```

### Issue: Type checking errors (Pylance)
These are warnings, not runtime errors. Code will still run.
To fix, install type stubs:
```bash
pip install pandas-stubs types-openpyxl
```

## 📚 Development

### Adding new features:

**1. Add new proxy:**
```python
# Edit profitpulse_pipeline.py → build_proxies()
df["X6_NEW"] = df["A"] / df["B"]
```

**2. Add new API endpoint:**
```python
# Edit backend/api_server.py
@app.route('/api/new-endpoint')
def new_endpoint():
    # Your logic
    return jsonify(result)
```

**3. Add new explanation rule:**
```python
# Edit core/explanations.py or profitpulse_pipeline.py → _reason_one_liner()
if z_roa < threshold:
    return "New explanation..."
```

## 🧪 Testing

```bash
# Test ProfitPulse pipeline
python test_profitpulse.py

# Test API endpoints
curl http://localhost:5000/health
curl http://localhost:5000/api/meta

# Test with data
python backend/main.py pipeline --use-profitpulse --data Data.xlsx
```

## 🎯 Commands Summary

| Command | Purpose |
|---------|---------|
| `python backend/main.py pipeline --use-profitpulse` | Run ProfitPulse pipeline |
| `python backend/main.py pipeline` | Run original pipeline |
| `python backend/main.py serve` | Start API server |
| `python backend/main.py all --use-profitpulse` | Run pipeline + start server |
| `python backend/profitpulse_pipeline.py` | Run ProfitPulse directly |
| `python backend/pipeline.py` | Run original pipeline directly |
| `python backend/api_server.py` | Start API server directly |
| `python test_profitpulse.py` | Test ProfitPulse pipeline |

## 📖 Documentation

- **Main README:** [../README.md](../README.md)
- **Migration Guide:** [../MIGRATION_GUIDE.md](../MIGRATION_GUIDE.md)
- **API Docs:** [../API_DOCS.md](../API_DOCS.md)
- **Architecture:** [../ARCHITECTURE.md](../ARCHITECTURE.md)

---

**Status:** ✅ Production Ready

**Last Updated:** February 2026
