# ProfitPulse - Vercel Deployment Guide

## Optimized for Serverless Deployment

This version is optimized for Vercel deployment with minimal dependencies.

### Key Changes:

1. **Minimal Dependencies** - Only Flask and essential packages
2. **No Heavy ML Libraries** - Removed pandas, numpy, scikit-learn, xgboost
3. **JSON-based Data** - Using pre-computed JSON artifacts instead of parquet files
4. **Lightweight API** - `api_vercel.py` with no ML model loading

### Deployment Size:
- **Target**: < 50 MB (well under 500 MB Lambda limit)
- **Dependencies**: ~15-20 MB
- **Total**: ~30-40 MB

### Structure:
```
backend/
  api_vercel.py          # Main API (optimized)
  utils/
    lightweight_loader.py # JSON data loader
artifacts_profitpulse/
  methodology_snapshot.json
  model_metrics.json
requirements.txt         # Minimal dependencies
vercel.json             # Vercel configuration
.vercelignore           # Exclude unnecessary files
.python-version         # Python 3.12
```

### Endpoints:
- `GET /` - API info
- `GET /api/health` - Health check
- `GET /api/meta` - Dataset metadata
- `GET /api/summary` - Summary statistics

### Local Testing:
```bash
cd backend
python api_vercel.py
```

### Deploy to Vercel:
```bash
vercel --prod
```

### Note:
For full ML functionality, use the original `api_server.py` on platforms like Render or Railway that support larger deployments.
