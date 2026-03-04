# ProfitPulse - Financial Analysis Platform

**Batch precompute system** for company profitability prediction using PCA + ML models.

## 🎯 System Overview

**ProfitPulse** predicts company profitability using batch-processed financial data through PCA analysis and machine learning.

### Architecture
- **Frontend**: React/Vite → Vercel
- **Backend**: Flask API → Render  
- **Database**: PostgreSQL → Supabase
- **Data Processing**: Batch pipeline (one-time compute, store results)

### Key Features (per FRS)
- **Public**: Home, Screener, Company details, How it works, Model performance
- **Authenticated**: Watchlist, Alerts
- **Admin**: Data import, Batch pipeline runner
- **Model**: PCA-based profit score, ML prediction (XGBoost/SVM/RF)
- **Data**: 628 companies, 37,976+ financial records

## 📦 Prerequisites

- Python 3.10+, Node.js 18+, Git
- [Render](https://render.com) - Backend hosting
- [Vercel](https://vercel.com) - Frontend hosting  
- [Supabase](https://supabase.com) - Database (✅ configured: 37,976+ rows)

## 🚀 Quick Start

```bash
# 1. Setup environment
cp .env.example .env  # Edit with Supabase credentials

# 2. Backend
cd backend
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
python app.py  # http://localhost:5000

# 3. Frontend (new terminal)
cd frontend
npm install && npm run dev  # http://localhost:5173

# 4. Test
cd scripts/supabase && python3 test_connection.py
```

---

## 🌐 Deployment

### 1. Push to GitHub
```bash
git init && git add . && git commit -m "Initial commit"
git remote add origin YOUR_GITHUB_REPO
git push -u origin main
```

### 2. Deploy Backend (Render)
1. [Render Dashboard](https://dashboard.render.com) → New Web Service
2. Config: Root Dir=`backend`, Start=`gunicorn app:app --bind 0.0.0.0:$PORT`
3. Add env vars: `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, `FLASK_ENV=production`

### 3. Deploy Frontend (Vercel)
```bash
npm install -g vercel
vercel login && vercel --prod
# Add env: VITE_API_URL=https://profitpulse-backend.onrender.com/api
```

**Full deployment guide**: See [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)

---

## 📁 Project Structure

```
ProfitPulse/
├── README.md              # 👈 You are here
├── .env                   # Environment variables (DO NOT COMMIT)
├── .env.example           # Template
│
├── docs/                  # 📚 Documentation
│   ├── SYSTEM_ARCHITECTURE.md    # Technical specification (FRS/SRS)
│   ├── PROJECT_STATUS.md         # Current status & roadmap
│   └── DEPLOYMENT_CHECKLIST.md   # Quick deployment guide
│
├── backend/               # 🐍 Flask API + ML Pipeline
│   ├── app.py            # Main API (Supabase-integrated)
│   ├── database.py       # Supabase connection manager
│   ├── requirements.txt  # Python dependencies (Render)
│   ├── render.yaml       # Render deployment config
│   └── core/             # Business logic (PCA, ML, preprocessing)
│
├── frontend/              # ⚛️ React/Vite UI
│   ├── src/
│   │   ├── pages/        # Home, Screener, Company, etc.
│   │   └── services/     # API client
│   ├── package.json
│   └── vite.config.js
│
├── api/                   # 🔧 Vercel Serverless Functions
│   ├── index.py          # Vercel API entry point
│   └── requirements.txt  # Minimal deps for Vercel
│
├── data/                  # 📊 Data Storage
│   ├── exports/          # Source Excel files (uploaded to Supabase)
│   └── artifacts/        # Model artifacts
│
└── scripts/               # 🛠️ Utility Scripts
    ├── supabase/         # Data upload & connection testing
    │   ├── upload_data.py
    │   ├── test_connection.py
    │   └── README.md
    └── utils/            # Helper scripts
        ├── test_backend.sh
        ├── demo.sh
        └── start.sh
```

---

## 📊 Database (Supabase)

**Status**: ✅ HEALTHY | **Tables**: 15/16 | **Records**: 37,976+

Key tables per FRS/SRS:
- `financial_raw` (7,600) - Raw financial data from Excel
- `company_master` (628) - Company metadata
- `proxies` - 5 proxies (X1_ROA..X5_NPM) + `is_complete` flag
- `index_scores` - PCA scores, P_t, Label_t per model version
- `predictions` - ML predictions (XGBoost/SVM/RF)
- `model_performance` - Accuracy/F1/AUC/ROC curves

---

## 🔐 Environment Variables

**Backend** (Render):
```env
SUPABASE_URL=https://fmsxvbtmfekgbuwxkntl.supabase.co
SUPABASE_SECRET_KEY=your_key
FLASK_ENV=production
```

**Frontend** (Vercel):
```env
VITE_API_URL=https://profitpulse-backend.onrender.com/api
VITE_SUPABASE_URL=https://fmsxvbtmfekgbuwxkntl.supabase.co
```

---

## 🧪 Testing

```bash
# Test database connection
cd scripts/supabase && python3 test_connection.py

# Test backend API
./scripts/utils/test_backend.sh
```

---

## 📚 Full Documentation

- **Technical Spec**: [docs/SYSTEM_ARCHITECTURE.md](docs/SYSTEM_ARCHITECTURE.md)
- **Project Status**: [docs/PROJECT_STATUS.md](docs/PROJECT_STATUS.md)
- **Deployment Guide**: [docs/DEPLOYMENT_CHECKLIST.md](docs/DEPLOYMENT_CHECKLIST.md)
- **Supabase Upload**: [scripts/supabase/README.md](scripts/supabase/README.md)

---

## 📚 API Endpoints (per SRS)

### Public
- `GET /api/meta` - Database metadata
- `GET /api/screener` - Filter companies (year/industry/min_score/pagination)
- `GET /api/company/<ticker>/overview` - Score, probability, drivers
- `GET /api/company/<ticker>/history` - Time-series data
- `GET /api/performance` - Model metrics (Table 7-9, ROC)

### Authenticated
- `GET/POST /api/watchlist` - User watchlist (RLS protected)
- `GET/POST /api/alerts` - Custom alerts

---

## 🎯 Features (per FRS)

**Public**:
- **Home**: Search ticker, CTA to screener
- **Screener**: Filter by year/exchange/industry/score/probability
- **Company**: Overview (score/probability/drivers) + History + Drivers tabs
- **How it works**: Pipeline explanation (fit/transform/PCA/ML)
- **Model performance**: Tables 7-9, ROC curves, confusion matrix

**Authenticated**:
- **Watchlist**: Track favorite companies
- **Alerts**: Notifications (score < X, probability < Y)

**Admin** (batch precompute):
- Import financial/company Excel
- Run pipeline: proxies → PCA → ML → predictions
- Publish model version

---

## 🐛 Troubleshooting

**"Supabase connection failed"**: Check `.env` credentials  
**"Module not found"**: `pip install -r requirements.txt`  
**"API not responding"**: Check backend is running on port 5000

---

## 📞 Resources

- **Technical Specification**: [docs/SYSTEM_ARCHITECTURE.md](docs/SYSTEM_ARCHITECTURE.md)
- **Project Status & Roadmap**: [docs/PROJECT_STATUS.md](docs/PROJECT_STATUS.md)
- **Deployment Guide**: [docs/DEPLOYMENT_CHECKLIST.md](docs/DEPLOYMENT_CHECKLIST.md)
- **Supabase Dashboard**: https://app.supabase.com
- **Render Dashboard**: https://dashboard.render.com
- **Vercel Dashboard**: https://vercel.com/dashboard

---

**Version**: 1.0.0 | **Status**: ✅ Production Ready
