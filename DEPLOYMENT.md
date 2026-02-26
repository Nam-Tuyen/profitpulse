# Deployment Guide

## Architecture

This project is split into two parts:

### Frontend (Vercel)
- **Deployed on**: Vercel
- **Location**: `/frontend` directory
- **Framework**: React + Vite + TailwindCSS
- **Build command**: `npm install && npm run build`
- **Output**: `frontend/dist`

### Backend (Render/Railway/Other)
- **Deployed on**: Render.com, Railway.app, or PythonAnywhere
- **Location**: Root directory (`app.py`) or `/backend` directory
- **Framework**: Flask + Pandas + Scikit-learn
- **Start command**: `python app.py` or `gunicorn app:app`

## Why Split?

Vercel has a **500MB Lambda limit**. Our Python dependencies (pandas, scikit-learn, numpy) exceed this limit (~796MB). The solution is:

1. Deploy lightweight **frontend** on Vercel (no Python dependencies)
2. Deploy **backend** on a service with better Python support

## Frontend Deployment (Vercel)

1. Push code to GitHub
2. Import project to Vercel
3. Vercel auto-detects Vite framework
4. Set environment variable: `VITE_API_URL=https://your-backend-url.com`
5. Deploy!

## Backend Deployment Options

### Option 1: Render.com (Recommended - Free tier)
```bash
# 1. Create new Web Service on Render
# 2. Connect GitHub repo
# 3. Configure:
Build Command: pip install -r requirements.txt
Start Command: gunicorn app:app --bind 0.0.0.0:$PORT
```

### Option 2: Railway.app
```bash
# 1. Create new project on Railway
# 2. Connect GitHub repo
# 3. Railway auto-detects Python app
# 4. Deploy!
```

### Option 3: PythonAnywhere
```bash
# 1. Upload files to PythonAnywhere
# 2. Create new web app (Flask)
# 3. Configure WSGI file
# 4. Reload web app
```

## Local Development

### Backend:
```bash
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

### Frontend:
```bash
cd frontend
npm install
npm run dev
```

## Environment Variables

### Frontend (.env in /frontend):
```
VITE_API_URL=http://localhost:5001  # Development
VITE_API_URL=https://your-backend.com  # Production
```

### Backend:
```
FLASK_ENV=production
PORT=5001
```

## Notes

- Frontend on Vercel: Static files only, ~2-5MB
- Backend elsewhere: Full Python ML stack, ~800MB
- This architecture allows us to use the best platform for each part
