# 🚀 Quick Start Guide - ProfitScore System

## ⚡ Fastest Way to Run

```bash
# In project root
cd /Users/namtuyen/Downloads/Project_code/final_thesis

# Run everything (pipeline + server) ⭐
python backend/main.py all --use-profitpulse --data Data.xlsx --port 5000
```

Then open: http://localhost:3000 (frontend) or http://localhost:5000 (API)

---

## 📋 Prerequisites

```bash
# Python 3.11+
python --version

# Install dependencies
pip install -r requirements.txt

# Frontend dependencies (separate terminal)
cd frontend && npm install
```

---

## 🎯 Common Tasks

### 1. **Run ML Pipeline Only**

```bash
# ProfitPulse (leakage-safe, recommended) ⭐
python backend/main.py pipeline --use-profitpulse

# Original (modular)
python backend/main.py pipeline
```

**Output:**
- ProfitPulse → `artifacts_profitpulse/` (6 files)
- Original → `backend/cache/` (3 files)

---

### 2. **Start API Server Only**

```bash
python backend/main.py serve --port 5000
```

**Test:**
```bash
curl http://localhost:5000/health
curl http://localhost:5000/api/meta
```

---

### 3. **Start Frontend**

```bash
cd frontend
npm run dev
```

**Access:** http://localhost:3000

---

### 4. **Run Full Stack**

**Terminal 1 - Backend:**
```bash
python backend/main.py all --use-profitpulse --data Data.xlsx
```

**Terminal 2 - Frontend:**
```bash
cd frontend && npm run dev
```

---

## 🔍 Verify Everything Works

### **1. Check Data File**
```bash
ls -lh Data.xlsx
# Should show: -rw-r--r-- ... 1.1M ... Data.xlsx
```

### **2. Test Pipeline**
```bash
python backend/main.py pipeline --use-profitpulse --data Data.xlsx
# Should complete without errors
```

### **3. Check Outputs**
```bash
ls -lh artifacts_profitpulse/
# Should show 6 .parquet and .json files
```

### **4. Test API**
```bash
# Start server (Terminal 1)
python backend/main.py serve

# Test endpoints (Terminal 2)
curl http://localhost:5000/health
curl http://localhost:5000/api/meta
curl "http://localhost:5000/api/screener?year=2021"
```

### **5. Test Frontend**
```bash
cd frontend
npm run dev
# Open http://localhost:3000
```

---

## 🛠️ Troubleshooting

### **"Command not found: python"**
```bash
# Try python3
python3 backend/main.py --help

# Or activate conda/venv
conda activate base
```

### **"ModuleNotFoundError: No module named 'sklearn'"**
```bash
pip install scikit-learn xgboost pandas numpy openpyxl pyarrow flask flask-cors
```

### **"Data.xlsx not found"**
```bash
# Ensure you're in project root
cd /Users/namtuyen/Downloads/Project_code/final_thesis
ls Data.xlsx
```

### **"Cache not found" from API**
```bash
# Run pipeline first
python backend/main.py pipeline --use-profitpulse
```

### **"Port 5000 already in use"**
```bash
# Use different port
python backend/main.py serve --port 8000

# Update frontend proxy (vite.config.js)
target: 'http://localhost:8000'
```

### **Frontend shows connection errors**
```bash
# 1. Check backend is running
curl http://localhost:5000/health

# 2. Check frontend proxy settings
cat frontend/vite.config.js | grep proxy

# 3. Restart frontend dev server
cd frontend
npm run dev
```

---

## 📁 File Locations

```
final_thesis/
├── Data.xlsx                    # Input data
├── backend/
│   ├── main.py                  # ⭐ Main entrypoint
│   ├── profitpulse_pipeline.py  # ProfitPulse pipeline
│   └── cache/                   # Cache (original pipeline)
│
├── artifacts_profitpulse/       # Cache (ProfitPulse)
│   ├── company_view.parquet
│   ├── screener_2023.parquet
│   ├── predictions_all.parquet
│   └── ...
│
└── frontend/
    ├── src/
    └── package.json
```

---

## 🎨 Available Commands

### Backend Commands:
```bash
# Help
python backend/main.py --help

# Pipeline
python backend/main.py pipeline --use-profitpulse
python backend/main.py pipeline --data Data.xlsx --train-year 2020

# Server
python backend/main.py serve
python backend/main.py serve --port 8000 --debug

# Both
python backend/main.py all --use-profitpulse
```

### Frontend Commands:
```bash
cd frontend

# Development
npm run dev          # Start dev server

# Build
npm run build        # Production build
npm run preview      # Preview production build

# Lint
npm run lint         # Check code quality
```

---

## 📡 API Endpoints Reference

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/api/meta` | GET | Metadata & config |
| `/api/screener` | GET | Filter companies |
| `/api/company/<ticker>` | GET | Company details |
| `/api/compare` | POST | Compare companies |
| `/api/summary` | GET | Summary statistics |
| `/api/alerts/top-risk` | GET | Top risk alerts |

**Examples:**
```bash
# Screener with filters
curl "http://localhost:5000/api/screener?year=2021&risk=High&min_chance=0.3"

# Company details
curl "http://localhost:5000/api/company/AAA?year=2021"

# Compare companies
curl -X POST http://localhost:5000/api/compare \
  -H "Content-Type: application/json" \
  -d '{"tickers": ["AAA", "BBB"], "year": 2021}'

# Top risk
curl "http://localhost:5000/api/alerts/top-risk?n=10"
```

---

## 🎯 Development Workflow

### **1. Make Changes**
```bash
# Edit backend files
vim backend/core/ml_models.py

# Or edit frontend files
vim frontend/src/pages/Home.jsx
```

### **2. Test Backend**
```bash
# Re-run pipeline
python backend/main.py pipeline --use-profitpulse

# Restart server (Ctrl+C then)
python backend/main.py serve
```

### **3. Test Frontend**
```bash
# Frontend auto-reloads, just refresh browser
# Or restart if needed
cd frontend
npm run dev
```

### **4. Check Logs**
```bash
# Backend logs in terminal
# Frontend logs in browser console (F12)
```

---

## 📊 Understanding Outputs

### **ProfitScore (P)**
- Composite score from 5 profit metrics
- Range: typically -3 to +3
- Higher = better profitability

### **Chance (%)**
- Predicted probability of positive profit next year
- Range: 0-100%
- >60% = Low risk, <40% = High risk

### **Risk Level**
- **Low:** Chance ≥ 60% (good outlook)
- **Medium:** 40% ≤ Chance < 60%
- **High:** Chance < 40% (need attention)

### **Borderline**
- ProfitScore near threshold (±0.10)
- Easy to change status if metrics fluctuate slightly

---

## 🔗 Useful Links

- **Backend Docs:** [backend/README.md](backend/README.md)
- **API Docs:** [API_DOCS.md](API_DOCS.md)
- **Migration Guide:** [MIGRATION_GUIDE.md](MIGRATION_GUIDE.md)
- **Fixes Summary:** [BACKEND_FIXES.md](BACKEND_FIXES.md)

---

## 💡 Tips

### **For Best Performance:**
1. Run ProfitPulse pipeline (leakage-safe) ⭐
2. Use artifacts cache (don't retrain on every API call)
3. Enable production build for frontend: `npm run build`

### **For Development:**
1. Use `--debug` flag for backend
2. Check browser console for frontend errors (F12)
3. Use `curl` to test API independently

### **For Production:**
1. Use ProfitPulse pipeline (more robust)
2. Set `DEBUG=False` in backend
3. Build frontend: `npm run build`
4. Use production server (gunicorn/nginx)

---

## ✅ Success Checklist

Before deployment, verify:

- [ ] Data.xlsx exists and is valid
- [ ] Pipeline runs without errors
- [ ] Artifacts generated (6 files for ProfitPulse)
- [ ] API server starts successfully
- [ ] All 7 API endpoints respond
- [ ] Frontend builds without errors
- [ ] Frontend connects to API
- [ ] All 5 pages work (Home, Screener, Company, Compare, Alerts)
- [ ] Charts render correctly
- [ ] Filters work in Screener
- [ ] Export CSV works

---

## 🎉 You're Ready!

**Quick run:**
```bash
# One command to rule them all ⭐
python backend/main.py all --use-profitpulse --data Data.xlsx --port 5000
```

Then in another terminal:
```bash
cd frontend && npm run dev
```

Open http://localhost:3000 and enjoy! 🚀

---

**Need help?** Check:
1. [BACKEND_FIXES.md](BACKEND_FIXES.md) - Recent fixes
2. [backend/README.md](backend/README.md) - Backend docs
3. [TROUBLESHOOTING.md](TROUBLESHOOTING.md) - Common issues (if exists)
4. Error logs in terminal

**Status:** ✅ Ready to Use
