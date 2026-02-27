# ProfitPulse Backend

Backend API for ProfitPulse - Financial Analysis System

## 🚀 Deploy on Render.com

1. Go to [render.com](https://render.com)
2. Create new "Web Service"
3. Connect GitHub repo: `Nam-Tuyen/profitpulse`
4. Settings:
   - **Root Directory**: `backend`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn app:app --bind 0.0.0.0:$PORT`
   - **Python Version**: 3.12

Or use the render.yaml file for automatic deployment.

## 📦 Files in this directory

- `app.py` - Main Flask application
- `requirements.txt` - Python dependencies  
- `Procfile` - Process configuration
- `runtime.txt` - Python version
- `render.yaml` - Render.com deployment config
- `core/` - Core ML pipeline modules
- `utils/` - Utility functions

## 🔧 Local Development

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

Backend will run on http://localhost:5000
