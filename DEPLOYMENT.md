# 🚀 Deployment Guide - Production Setup

Deploy ProfitPulse to production using Render (backend) and Vercel (frontend).

## 📋 Overview

```
GitHub Repository (Main Branch)
    ↓
Render (Backend)          Vercel (Frontend)
Python 3.12, Flask        React, Vite
profitpulse-ihv0...       (Your Vercel URL)
    ↓                          ↓
Both Connect to Supabase Database
```

## 🔧 Backend Deployment (Render)

### Prerequisites
- Render account (free tier available): https://render.com
- GitHub repository connected to Render
- Supabase credentials ready

### Step 1: Setup on Render Dashboard

1. Go to: https://dashboard.render.com
2. Click **"New Web Service"**
3. Connect GitHub repository: `Nam-Tuyen/profitpulse`
4. Configure:
   - **Name:** `profitpulse`
   - **Environment:** Python 3
   - **Root Directory:** `backend`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `gunicorn app:app --bind 0.0.0.0:$PORT`
   - **Instance Type:** Free

### Step 2: Add Environment Variables

On Render Dashboard → Settings → Environment Variables:

| Key | Value |
|-----|-------|
| `SUPABASE_URL` | `https://fmsxvbtmfekgbuwxkntl.supabase.co` |
| `SUPABASE_SECRET_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (220 chars JWT) |
| `FLASK_ENV` | `production` |

**How to get `SUPABASE_SECRET_KEY`:**
1. Supabase Dashboard → Project Settings → API
2. Copy "Service Role Key" (starts with `eyJ`)
3. Paste into Render

### Step 3: Deploy

1. Click **"Create Web Service"**
2. Render automatically builds from `main` branch
3. Deployment takes ~2-3 minutes
4. Watch build logs for errors

**Expected success message:**
```
✅ Connected to Supabase
[INFO] Listening at: http://0.0.0.0:10000
[INFO] Using worker: sync
```

### Step 4: Verify Backend

```bash
# Health check
curl https://profitpulse-ihv0.onrender.com/health

# Expected response
{"status": "ok", "database": "Supabase PostgreSQL", "version": "1.0.0"}
```

---

## 🌐 Frontend Deployment (Vercel)

### Prerequisites
- Vercel account (free tier): https://vercel.com
- GitHub repository connected to Vercel (auto on first push)

### Step 1: Automatic Setup

1. Push code to GitHub: `git push origin main`
2. Vercel automatically detects and creates project
3. Visit: https://vercel.com/dashboard/projects
4. Find `profitpulse` project

### Step 2: Add Environment Variables

On Vercel Dashboard → Project Settings → Environment Variables:

| Key | Value | Environments |
|-----|-------|--------------|
| `VITE_API_URL` | `https://profitpulse-ihv0.onrender.com` | ✅ Prod ✅ Preview ✅ Dev |

### Step 3: Redeploy

1. **Deployments** tab
2. Latest deployment → Click **"Redeploy"**
3. Wait for deployment to finish

**Expected success:** Green checkmark, deployments show success.

### Step 4: Verify Frontend

1. Click deployment link
2. Website should load
3. Open DevTools (F12) → Console
4. Check for errors
5. Test loading data

---

## ✅ Post-Deployment Verification

### Test All Endpoints

```bash
# Backend health
curl https://profitpulse-ihv0.onrender.com/health

# Get companies
curl https://profitpulse-ihv0.onrender.com/api/meta

# Get specific company
curl "https://profitpulse-ihv0.onrender.com/api/company/VNM"

# Screener
curl "https://profitpulse-ihv0.onrender.com/api/screener?year=2023&limit=5"
```

### Test Frontend

1. Open Vercel deployment URL
2. Navigate to each page:
   - ✅ Home
   - ✅ Screener
   - ✅ Company page (search VNM)
   - ✅ Compare
   - ✅ Alerts
   - ✅ About
3. Check console for errors (F12)
4. Verify data loads from backend

### Check Logs

**Render Backend Logs:**
- Dashboard → `profitpulse` → Logs
- Look for: ✅ Supabase connection confirmation

**Vercel Frontend Logs:**
- Dashboard → Project → Deployments → Latest → Logs
- Look for: ✅ Build successful, no errors

---

## 🐛 Troubleshooting Deployment

### Backend: Build Failed

**Error:** "No such file or directory: requirements.txt"
- **Fix:** Check Root Directory = `backend` in Render settings

**Error:** "TypeError: Client.__init__() got proxy argument"
- **Fix:** Dependencies are updated. Redeploy from GitHub.

**Error:** "ModuleNotFoundError"
- **Fix:** Ensure all files are committed and pushed to GitHub

### Backend: Runtime Error

**Error:** "Missing Supabase credentials"
- **Fix:** Add `SUPABASE_URL` and `SUPABASE_SECRET_KEY` to Render environment

**Error:** "Connection refused" to Supabase
- **Fix:** Check Supabase URL and secret key are correct

**Error:** 502 Bad Gateway
- **Fix:** Free tier may be slow. Wait 30s and retry.

### Frontend: Can't reach Backend

**Error in console:** "Failed to fetch from profitpulse-ihv0.onrender.com"
- **Fix:** Add `VITE_API_URL` environment variable to Vercel
- **Fix:** Redeploy after adding environment variable

**Error:** Data doesn't load
- **Fix:** Check backend is running
- **Fix:** Verify `VITE_API_URL` points to correct backend URL
- **Fix:** Open DevTools Network tab to see actual URL being called

---

## 📊 Deployment Checklist

### Code Preparation
- [ ] All changes committed to GitHub
- [ ] Pushed to `main` branch
- [ ] No merge conflicts
- [ ] No hardcoded credentials in code

### Backend (Render)
- [ ] Render account created
- [ ] GitHub connected to Render
- [ ] Web Service created with correct settings:
  - [ ] Root Directory = `backend`
  - [ ] Build Command = `pip install -r requirements.txt`
  - [ ] Start Command = `gunicorn app:app --bind 0.0.0.0:$PORT`
- [ ] Environment Variables set:
  - [ ] `SUPABASE_URL`
  - [ ] `SUPABASE_SECRET_KEY`
  - [ ] `FLASK_ENV=production`
- [ ] Deployment successful (green status)
- [ ] Health endpoint working: `/health`
- [ ] API endpoints responding with data

### Frontend (Vercel)
- [ ] Vercel account created
- [ ] GitHub connected to Vercel
- [ ] Project auto-created or manually added
- [ ] Environment Variables set:
  - [ ] `VITE_API_URL=https://profitpulse-ihv0.onrender.com`
- [ ] Redeploy triggered after adding env vars
- [ ] Deployment successful (green status)
- [ ] Website loads at provided URL
- [ ] Pages navigate without errors
- [ ] Data loads from backend

### Database (Supabase)
- [ ] Supabase project active
- [ ] 15 tables created
- [ ] Data loaded (628 companies)
- [ ] Service role key accessible
- [ ] Backend can connect and query

### Monitoring
- [ ] Render logs checked (no errors)
- [ ] Vercel logs checked (no errors)
- [ ] All API endpoints tested
- [ ] Frontend pages working
- [ ] No console errors in browser

---

## 🔄 Continuous Deployment

### Auto-Deploy on Push

**Render:** Automatically deploys when code is pushed to GitHub
```bash
git push origin main  # Auto-triggers Render build
```

**Vercel:** Automatically deploys on GitHub push
```bash
git push origin main  # Auto-triggers Vercel build
```

### Manual Deploy

**Render:**
1. Dashboard → `profitpulse` → **"Manual Deploy"**
2. Select branch → Deploy

**Vercel:**
1. Dashboard → Project → Deployments
2. Latest → **"Redeploy"**

---

## 📈 Monitoring

### Health Checks

```bash
# Backend status (daily)
curl https://profitpulse-ihv0.onrender.com/health

# Database queries (weekly)
curl https://profitpulse-ihv0.onrender.com/api/meta
```

### Performance

- Backend response time: <500ms (normal)
- Frontend load time: <3 seconds (Vercel CDN)
- Database queries: <200ms for single company

### Logs

- **Render:** Dashboard → Logs (live view)
- **Vercel:** Dashboard → Deployments → Function Logs
- **Supabase:** Project → Logs (SQL queries, errors)

---

## 🔐 Security in Production

1. **Secret Management:**
   - Never commit `.env` to Git ✅ (in .gitignore)
   - Use Render/Vercel dashboard for secrets ✅
   - Rotate Supabase keys regularly

2. **Access Control:**
   - Service role key only in backend ✅
   - Frontend uses public key (not implemented yet)
   - CORS configured for specific origins

3. **Data Protection:**
   - All connections over HTTPS ✅
   - Database behind Supabase auth ✅
   - Consider RLS policies for public data

---

## 📞 Support

For deployment issues:

1. **Check logs first:**
   - Render: https://dashboard.render.com → Logs
   - Vercel: https://vercel.com → Deployments → Logs

2. **Verify environment variables:**
   - All required vars set
   - Correct values (no typos)
   - Correct environments selected

3. **Test connectivity:**
   - Backend: `curl https://profitpulse-ihv0.onrender.com/health`
   - Frontend: Open website, check console (F12)

4. **Check status pages:**
   - Render: https://status.render.com
   - Vercel: https://www.vercel-status.com
   - Supabase: https://status.supabase.com

---

**Last Updated:** March 2026  
**Status:** ✅ Production Stable
