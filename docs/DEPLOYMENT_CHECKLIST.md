# 🚀 Deployment Checklist

Quick deployment guide for ProfitPulse to production.

---

## ✅ Pre-Deployment (DONE)

- [x] Database setup: Supabase (37,976+ rows in 15/16 tables)
- [x] Backend API: Flask with Supabase integration
- [x] Frontend: React/Vite application
- [x] Deployment configs: render.yaml, vercel.json
- [x] Environment templates: .env.example
- [x] Documentation: README.md, PROJECT_STATUS.md

---

## 📋 Deployment Steps

### 1. Local Testing (Optional but Recommended)

```bash
# Test database
cd scripts/supabase && python3 test_connection.py

# Test backend
cd backend && python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt && python app.py

# In another terminal, test API
./test_backend.sh
```

### 2. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/ProfitPulse.git
git push -u origin main
```

### 3. Deploy Backend (Render)

1. Go to [dashboard.render.com](https://dashboard.render.com) → New Web Service
2. Connect GitHub repo
3. Config:
   - Root Directory: `backend`
   - Build: `pip install -r requirements.txt`
   - Start: `gunicorn app:app --bind 0.0.0.0:$PORT`
4. Environment variables:
   ```
   FLASK_ENV=production
   SUPABASE_URL=https://fmsxvbtmfekgbuwxkntl.supabase.co
   SUPABASE_SECRET_KEY=<from .env>
   ```
5. Deploy → wait ~5 min → copy backend URL

### 4. Deploy Frontend (Vercel)

```bash
npm install -g vercel
vercel login
vercel --prod

# Add environment variables (via dashboard or CLI)
VITE_API_URL=https://profitpulse-backend.onrender.com/api
VITE_SUPABASE_URL=https://fmsxvbtmfekgbuwxkntl.supabase.co

# Redeploy with env vars
vercel --prod
```

### 5. Verify Deployment

```bash
# Test backend
curl https://profitpulse-backend.onrender.com/health

# Test frontend
# Open https://profitpulse.vercel.app in browser
```

---

## 🔧 Troubleshooting

**Backend not responding**: Check Render logs, verify env vars  
**Frontend API errors**: Verify `VITE_API_URL` in Vercel settings  
**Database connection failed**: Check Supabase credentials in `.env`

---

## 📚 Full Documentation

See [README.md](README.md) for detailed deployment guide.
