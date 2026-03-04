# 📊 ProfitPulse - Stock Profit Analysis & Prediction System

> Phân tích và dự báo lợi nhuận công ty niêm yết Việt Nam

## 🎯 What is ProfitPulse?

ProfitPulse is a comprehensive financial analysis platform that uses machine learning to predict and analyze company profitability. It provides risk scores, profit trends, and predictive models for Vietnamese stock companies.

**Key Features:**
- 📈 **628 Companies** from Vietnamese stock exchange
- 🤖 **ML-Powered Predictions** (PCA, XGBoost, SVM, Random Forest)
- 📊 **Risk Scoring** based on financial metrics
- 🔍 **Advanced Screener** with filters and comparisons
- ⚠️ **Alert System** for significant changes
- 📱 **Modern Web Interface** (React + Vite)

## 🏗️ Architecture Overview

```
┌──────────────────────────────────────┐
│  Frontend (React + Vite)             │
│  Deployed on Vercel                  │
└────────────────┬─────────────────────┘
                 │ HTTPS API Calls
                 ▼
┌──────────────────────────────────────┐
│  Backend (Flask + Python)            │
│  Deployed on Render                  │
│  URL: profitpulse-ihv0.onrender.com  │
└────────────────┬─────────────────────┘
                 │ SQL Queries
                 ▼
┌──────────────────────────────────────┐
│  Database (Supabase PostgreSQL)      │
│  15 tables, 38K+ rows                │
└──────────────────────────────────────┘
```

## 🚀 Quick Start

### Local Development
```bash
# Backend
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python app.py  # Runs on http://localhost:5000

# Frontend (new terminal)
cd frontend
npm install
npm run dev    # Runs on http://localhost:5173
```

### View API Documentation
- Health Check: `curl https://profitpulse-ihv0.onrender.com/health`
- All Companies: `curl https://profitpulse-ihv0.onrender.com/api/meta`
- Specific Company: `curl https://profitpulse-ihv0.onrender.com/api/company/VNM`

For complete API reference, see [docs/API.md](docs/API.md)

## 📦 Project Structure

```
ProfitPulse/
├── README.md                    # This file
├── QUICK_START.md              # Development setup guide
├── DEPLOYMENT.md               # Production deployment guide
├── frontend/                   # React + Vite app
│   ├── src/
│   ├── public/
│   └── package.json
├── backend/                    # Flask API server
│   ├── app.py                 # Main application
│   ├── database.py            # Supabase connection
│   ├── requirements.txt        # Python dependencies
│   └── core/                  # ML models and business logic
├── docs/
│   ├── ARCHITECTURE.md         # System design & database schema
│   ├── API.md                 # API endpoint documentation
│   ├── ENVIRONMENT_VARIABLES.md # Env vars for deployment
│   └── TROUBLESHOOTING.md      # Common issues & solutions
└── scripts/                     # Data processing scripts
```

## 🌐 Live Deployment

### Frontend
- **Platform:** Vercel
- **URL:** https://profitpulse.vercel.app (coming soon)
- **Status:** Auto-deployed on GitHub push

### Backend
- **Platform:** Render
- **URL:** https://profitpulse-ihv0.onrender.com
- **Status:** ✅ Running
- **Health Check:** All endpoints operational

### Database
- **Platform:** Supabase (PostgreSQL)
- **Companies:** 628 stocks
- **Data:** 38,000+ financial records
- **Status:** ✅ Connected

## 📖 Documentation

| Document | Purpose |
|----------|---------|
| [QUICK_START.md](QUICK_START.md) | Local development setup |
| [DEPLOYMENT.md](DEPLOYMENT.md) | Production deployment guide |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | System design & database schema |
| [docs/API.md](docs/API.md) | API endpoint reference |
| [docs/ENVIRONMENT_VARIABLES.md](docs/ENVIRONMENT_VARIABLES.md) | Environment setup for deployment |
| [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) | Common issues & solutions |

## 🔑 Key Technologies

**Frontend:**
- React 18
- Vite (build tool)
- Tailwind CSS (styling)
- Axios (HTTP client)
- Lucide Icons
- React Router

**Backend:**
- Flask 3.0 (Python web framework)
- Supabase (PostgreSQL database)
- scikit-learn (ML models)
- XGBoost (Gradient boosting)
- pandas (Data processing)
- gunicorn (WSGI server)

**Deployment:**
- Vercel (Frontend)
- Render (Backend)
- Supabase (Database)

## 🤝 Contributing

This is a personal project. For improvements, create an issue or submit a pull request.

## 📊 Data & Models

**Financial Metrics:**
- Revenue, Net Income, Assets, Equity
- ROA (Return on Assets)
- NPM (Net Profit Margin)
- Key financial ratios

**Prediction Models:**
- PCA (Principal Component Analysis) for dimensionality reduction
- XGBoost for profit prediction
- SVM for risk classification
- Random Forest for ensemble predictions

**Risk Categories:**
- High Risk: Negative trend or declining metrics
- Low Risk: Stable or improving financial position
- Borderline: Unclear/neutral signals

## 🔐 Security

- Service role key for backend (Supabase)
- Environment variables for secrets
- CORS enabled for frontend-backend communication
- CSP configured for strict security

## 📞 Support

For issues or questions:
1. Check [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md)
2. Review API status: https://profitpulse-ihv0.onrender.com/health
3. Check deployment logs on Render/Vercel dashboard

## 📄 License

Personal project - All rights reserved

---

**Last Updated:** March 2026  
**Version:** 1.0.1  
**Status:** ✅ Production Ready
