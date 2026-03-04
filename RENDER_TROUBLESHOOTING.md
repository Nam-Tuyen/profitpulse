# 🚨 Fix Render Deployment Issues

## ❌ Current Problem
Render deployment exits with status 1 without clear logs.

## ✅ Solution: Check These Settings

### 1. Root Directory
**Must be:** `backend`

If you see the setting showing:
- Root Directory: (empty) ❌
- Root Directory: `backend` ✅

### 2. Build Command
**Must be:** `pip install -r requirements.txt`

NOT:
- `gunicorn app:app --bind 0.0.0.0:$PORT` ❌ (this is start command)

### 3. Start Command  
**Must be:** `gunicorn app:app --bind 0.0.0.0:$PORT`

NOT:
- `npm start` ❌
- `python app.py` ❌

### 4. Environment Variables (ALL 3 required)
```
SUPABASE_URL = https://fmsxvbtmfekgbuwxkntl.supabase.co
SUPABASE_SECRET_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZtc3h2YnRtZmVrZ2J1d3hrbnRsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjUyNjIxMiwiZXhwIjoyMDg4MTAyMjEyfQ.af-vhKAV4uQTT9zHX7ZO-WjkoxW6_54io5kZDN66iQk
FLASK_ENV = production
```

## 🔧 How to Fix

### Option A: Use Existing Service (Recommended)
1. Go to https://dashboard.render.com/
2. Click on **profitpulse** service
3. Click **Settings** tab
4. Scroll to **"Build & Deploy"** section
5. **Verify/Update:**
   - Root Directory: `backend`
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `gunicorn app:app --bind 0.0.0.0:$PORT`
6. Click **"Save Changes"**
7. Go to **Environment** tab
8. **Verify all 3 env vars** (see above)
9. **Manual Deploy** → Choose `main` branch → Deploy

### Option B: Delete and Recreate (If Settings Can't Be Changed)
Sometimes Render locks certain settings. If you can't edit Root Directory:

1. **Delete** current service (Settings → Delete Service)
2. **Create New Web Service:**
   - Repository: `Nam-Tuyen/profitpulse`
   - Branch: `main`
   - Root Directory: `backend` ⚠️ **IMPORTANT!**
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `gunicorn app:app --bind 0.0.0.0:$PORT`
   - Instance Type: Free
3. **Add Environment Variables** (all 3)
4. **Deploy**

## 📊 Expected Logs (Success)
```
==> Building...
Collecting Flask==3.0.0
...
Successfully installed Flask-3.0.0 supabase-2.3.0 ...
==> Build successful 🎉

==> Deploying...
==> Running 'gunicorn app:app --bind 0.0.0.0:$PORT'
✅ Connected to Supabase: https://fmsxvbtmfekgbuwxkntl.supabase.co
[INFO] Starting gunicorn 21.2.0
[INFO] Listening at: http://0.0.0.0:10000
[INFO] Using worker: sync
[INFO] Booting worker with pid: 8
```

## 🧪 After Successful Deploy
```bash
curl https://profitpulse-ihv0.onrender.com/health

# Expected:
{
  "success": true,
  "status": "ok",
  "message": "ProfitPulse API is running",
  "database": "Supabase PostgreSQL",
  "version": "1.0.0"
}
```

## 🐛 Common Issues

### Issue: "No such file or directory: requirements.txt"
**Cause:** Root Directory not set to `backend`  
**Fix:** Set Root Directory to `backend` in Settings

### Issue: "ModuleNotFoundError: No module named 'app'"
**Cause:** Start command wrong or Root Directory wrong  
**Fix:** Ensure Root Directory = `backend` and Start Command = `gunicorn app:app --bind 0.0.0.0:$PORT`

### Issue: "Invalid API key" in logs
**Cause:** SUPABASE_SECRET_KEY is wrong (still using old 41-char key)  
**Fix:** Update to 220-char JWT key in Environment Variables
