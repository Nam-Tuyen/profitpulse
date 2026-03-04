# Quick Start - Local Development

Get ProfitPulse running locally in ~5 minutes.

## Prerequisites

- Python 3.10+ (for backend)
- Node.js 18+ (for frontend)
- Git
- Basic terminal knowledge

## Setup

### 1. Clone & Navigate
```bash
cd /Users/namtuyen/Downloads/Project_code/Profit\ Pulse/ProfitPulse
```

### 2. Setup Environment Variables

Create `.env` file in project root:
```env
# Supabase Configuration
SUPABASE_URL=https://fmsxvbtmfekgbuwxkntl.supabase.co
SUPABASE_SECRET_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...  # 220 chars JWT

# Backend
FLASK_ENV=development
PORT=5000

# Frontend (for local backend calls)
VITE_API_URL=http://localhost:5000
```

### 3. Start Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python app.py
```

**Expected output:**
```
Connected to Supabase: https://fmsxvbtmfekgbuwxkntl.supabase.co
 * Running on http://127.0.0.1:5000
```

### 4. Start Frontend (new terminal)

```bash
cd frontend
npm install
npm run dev
```

**Expected output:**
```
  VITE v4.x.x  ready in 234 ms

  ➜  Local:   http://localhost:5173/
```

### 5. Open in Browser

Navigate to: **http://localhost:5173**

## Verify Everything Works

### Backend Health
```bash
curl http://localhost:5000/health
# Response: {"status": "ok", "database": "Supabase PostgreSQL", ...}
```

### API Endpoints
```bash
# Get all companies
curl http://localhost:5000/api/meta

# Get specific company (VNM example)
curl http://localhost:5000/api/company/VNM

# Screener with filters
curl "http://localhost:5000/api/screener?year=2023&limit=10"
```

### Frontend Testing
1. Open http://localhost:5173
2. Check DevTools Console (F12)
3. No errors should appear
4. Try navigating pages and loading data

## Stop Services

**Backend:**
```bash
# In backend terminal: Ctrl+C
```

**Frontend:**
```bash
# In frontend terminal: Ctrl+C
```

## Common Issues

### "Cannot find module" / Import errors
```bash
# Reinstall dependencies
cd backend
pip install --upgrade -r requirements.txt

cd ../frontend
rm -rf node_modules
npm install
```

### Port already in use
```bash
# Kill process on port 5000 (backend)
lsof -ti:5000 | xargs kill -9

# Or change PORT in .env to 5001
```

### Supabase connection error
```
ValueError: Missing Supabase credentials
```
- Check `.env` file exists
- Verify `SUPABASE_URL` and `SUPABASE_SECRET_KEY` are correct
- Keys must be set before starting backend

### CORS errors in frontend
Check `backend/app.py` has:
```python
from flask_cors import CORS
CORS(app)  # ✅ Must be present
```

### Frontend can't reach backend
1. Ensure backend is running on port 5000
2. Check `VITE_API_URL=http://localhost:5000` in `.env`
3. Open DevTools Network tab to verify requests

## Next Steps

- Explore [DEPLOYMENT.md](DEPLOYMENT.md) for production setup
- Read [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for system design
- Check [docs/API.md](docs/API.md) for all available endpoints
- See [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) for advanced issues

## Development Tips

### Hot Reload
- **Backend:** Restart required (no auto-reload for Flask)
- **Frontend:** Auto-reload on file save (Vite)

### Debugging
```bash
# Backend: Add print statements or use debugger
# Frontend: Use DevTools (F12) for browser debugging
```

### Database
- Access Supabase: https://supabase.com/dashboard
- View tables, data, and logs
- Manually query data if needed

### Git Workflow
```bash
git status                 # Check changes
git add .                  # Stage changes
git commit -m "message"    # Commit
git push origin main       # Push to GitHub
```

## Performance Tips

1. **Backend:** Use production mode for testing (`FLASK_ENV=production`)
2. **Frontend:** Test with `npm run build` to check bundle size
3. **Database:** API responses should be <500ms normally

## Success Criteria

- Backend running without errors  
- Frontend loads at http://localhost:5173  
- Data displays from database  
- No console errors in DevTools  
- API responses return valid JSON  
- All pages navigable  

**If all criteria met, you are ready for development!**
