# 🚀 Quick Deploy to Vercel (Frontend Only)

## ⚠️ Important Note

Due to Vercel's 500MB Lambda limit, **only the frontend** is deployed on Vercel.

The backend (Python/Flask/ML) must be deployed separately on:
- **Render.com** (recommended - free tier)
- **Railway.app** 
- **PythonAnywhere**
- Or any Python hosting service

## 📝 Steps

### 1. Deploy Frontend to Vercel
✅ Push to GitHub (already done)  
✅ Import to Vercel  
✅ Vercel auto-detects Vite  
✅ Add env var: `VITE_API_URL=https://your-backend-url.com`  
✅ Deploy!

### 2. Deploy Backend Separately

#### Option A: Render.com (Free)
1. Go to [render.com](https://render.com)
2. Create "New Web Service"
3. Connect your GitHub repo
4. Settings:
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn app:app --bind 0.0.0.0:$PORT`
5. Deploy!

#### Option B: Railway.app
1. Go to [railway.app](https://railway.app)
2. Create new project from GitHub
3. Railway auto-detects and deploys
4. Done!

### 3. Connect Frontend to Backend
In Vercel dashboard:
- Add environment variable:
  - Key: `VITE_API_URL`
  - Value: `https://your-backend-from-render.onrender.com`
- Redeploy frontend

## 🎉 Done!

Your app is now live with:
- ⚡ Fast frontend on Vercel
- 🐍 Python backend on Render/Railway

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed instructions.
