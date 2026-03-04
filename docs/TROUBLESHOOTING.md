# 🐛 Troubleshooting Guide

Common issues and solutions for ProfitPulse.

## Backend Issues

### Issue: Backend won't start

**Error:**
```
ValueError: Missing Supabase credentials in environment variables
```

**Solution:**
1. Check `.env` file exists in project root
2. Verify `SUPABASE_URL` and `SUPABASE_SECRET_KEY` are set
3. Check values are not empty or with extra spaces
4. Restart backend:
```bash
cd backend
python app.py
```

---

### Issue: "Address already in use"

**Error:**
```
OSError: [Errno 48] Address already in use: ('::', 5000, 0, 0)
```

**Solution:**
```bash
# Find process using port 5000
lsof -ti:5000

# Kill the process
lsof -ti:5000 | xargs kill -9

# Or use different port
PORT=5001 python app.py
```

---

### Issue: Cannot connect to database

**Error:**
```
ConnectionError: Failed to establish connection to Supabase
ECONNREFUSED: connection refused
```

**Solution:**
1. Verify `SUPABASE_URL` is correct format: `https://xxx.supabase.co`
2. Check `SUPABASE_SECRET_KEY` is valid (220 chars, starts with `eyJ`)
3. Test manually:
```python
from supabase import create_client
client = create_client(
    "https://fmsxvbtmfekgbuwxkntl.supabase.co",
    "your_key_here"
)
print("✅ Connected" if client else "❌ Failed")
```
4. Check Supabase status: https://status.supabase.com

---

### Issue: API endpoint returns 404

**Error:**
```
GET /api/company/VNM → 404 Not Found
```

**Solution:**
1. Check endpoint exists in `backend/app.py`
2. Check route spelling (case-sensitive)
3. Verify Backend is running
4. Check logs for error messages
5. Test with curl:
```bash
curl http://localhost:5000/health
curl http://localhost:5000/api/meta
```

---

### Issue: Render deployment fails

**Error:** "Build failed" or "Exited with status 1"

**Solution:**
1. Check Render logs: https://dashboard.render.com → Logs
2. Verify Root Directory = `backend`
3. Verify Build Command = `pip install -r requirements.txt`
4. Verify Start Command = `gunicorn app:app --bind 0.0.0.0:$PORT`
5. Check environment variables are set on Render
6. Force redeploy:
   - Render Dashboard → Manual Deploy
   - Select branch `main`
   - Click Deploy

---

## Frontend Issues

### Issue: Page won't load / blank screen

**Solution:**
1. Force refresh: `Ctrl+Shift+R` (clear cache)
2. Check browser console: `F12` → Console tab
3. Look for error messages
4. Check Network tab for failed requests
5. Verify backend URL in DevTools:
```javascript
// In console:
fetch('http://localhost:5000/health').then(r => r.json()).then(console.log)
```

---

### Issue: CSP violation errors

**Error:**
```
Content Security Policy: The page's settings blocked... 'self'
```

**Solution:**
1. Check `frontend/index.html` has correct CSP meta tag
2. Allowed sources should include:
   - `https://profitpulse-ihv0.onrender.com` (backend)
   - `https://vercel.live` (Vercel live feedback)
3. For development, may need to relax CSP temporarily

---

### Issue: Cannot reach backend API

**Error in console:**
```
Failed to fetch from https://profitpulse-ihv0.onrender.com
Network error
```

**Solution:**
1. Check backend is running: `curl https://profitpulse-ihv0.onrender.com/health`
2. If 502 error: Backend may be starting, wait 30 seconds
3. Check `VITE_API_URL` environment variable:
   - Local: Should be `http://localhost:5000`
   - Production: Should be `https://profitpulse-ihv0.onrender.com`
4. For Vercel: Add `VITE_API_URL` to environment variables and redeploy
5. Check CORS headers in response (should allow frontend origin)

---

### Issue: No data displaying

**Symptoms:**
- Page loads but no data shown
- Empty tables/lists
- "Loading..." spinner won't go away

**Solution:**
1. Check browser console for errors
2. Check Network tab → API calls
   - Verify endpoint URLs are correct
   - Check response status codes (should be 200)
   - Check response has data (not empty)
3. Test API directly:
```bash
curl https://profitpulse-ihv0.onrender.com/api/meta
curl "https://profitpulse-ihv0.onrender.com/api/company/VNM"
```
4. If API returns empty data:
   - Database may not have data loaded
   - Check Supabase tables
   - Verify query parameters


---

## Database Issues

### Issue: No companies in database

**Problem:**
- `/api/meta` returns empty array
- Can't find any company data

**Solution:**
1. Check Supabase database directly:
   - Supabase Dashboard → companies table
   - Should have ~628 rows
2. If empty:
   - Data may not be uploaded
   - Run data upload script:
   ```bash
   cd scripts/supabase
   python upload_data.py
   ```
3. Check upload logs:
   ```bash
   cat upload_log_full.txt
   ```

---

### Issue: Cannot query specific company

**Error:**
```
GET /api/company/VNM → {"ticker": null, "data": []}
```

**Causes:**
- Company not in database
- Ticker name incorrect (case-sensitive)
- Data not loaded

**Solution:**
1. Check correct ticker exists:
```bash
curl https://profitpulse-ihv0.onrender.com/api/meta | grep "VNM"
```
2. Try different ticker:
```bash
curl https://profitpulse-ihv0.onrender.com/api/company/SMB
```
3. If still fails, verify data is in Supabase:
   - Supabase Dashboard → financial_raw table
   - Filter by ticker
   - Check data exists

---

## Deployment Issues

### Issue: Vercel build fails

**Error:**
```
Build failed
npm ERR! code ENOENT
npm ERR! enoent ENOENT: no such file or directory
```

**Solution:**
1. Check `frontend/package.json` exists
2. Check all dependencies are correct
3. Verify no circular dependencies
4. Check Node version: Use Node 18+ (Vercel default)
5. Clear Vercel cache:
   - Project Settings → Purge Build Cache
   - Redeploy

---

### Issue: Render free tier sleeping

**Problem:**
```
502 Bad Gateway
Failed to establish connection
```

**Why:**
- Render free tier spins down after 15 mins inactivity
- Cold start takes 30 seconds

**Solution:**
1. Wait 30-60 seconds (normal cold start)
2. Try again: `curl https://profitpulse-ihv0.onrender.com/health`
3. For production: Upgrade to paid tier (prevents sleep)

---

### Issue: Environment variables not loading

**Problem:**
```
Missing SUPABASE_URL
Invalid API key
```

**Solution:**
1. Verify variables are set on deployment platform:
   - Render: Dashboard → Settings → Environment
   - Vercel: Dashboard → Settings → Environment Variables
2. Check variable names are exactly correct (case-sensitive)
3. Check no extra spaces in values
4. Redeploy after adding/changing variables
5. Verify in logs that variables were loaded

---

## Performance Issues

### Issue: Backend slow (>1 second response time)

**Causes:**
- Render free tier cold start
- Database query is slow
- Too much data being transferred

**Solution:**
1. Check Supabase performance:
   - Dashboard → Performance → Queries
   - Look for slow queries
2. Add database indexes if needed
3. Limit response data (use pagination)
4. Cache frequent queries

---

### Issue: Frontend slow

**Causes:**
- Large bundle size
- Too many API calls
- Unoptimized components

**Solution:**
1. Check bundle size:
```bash
npm run build
ls -lh dist/
```
2. Check network requests (DevTools → Network)
3. Check for memory leaks:
   - DevTools → Performance
   - Record page load
   - Look for unused memory

---

## Network Issues

### Issue: CORS error in frontend

**Error:**
```
Access to XMLHttpRequest... blocked by CORS policy
```

**Solution:**
1. Check backend has CORS enabled:
```python
# In app.py, should have:
from flask_cors import CORS
CORS(app)  # ✅ Required
```
2. Check API response includes CORS headers:
```bash
curl -i https://profitpulse-ihv0.onrender.com/health
# Look for: Access-Control-Allow-Origin: *
```
3. Verify frontend origin is allowed (should be *)

---

### Issue: Timeout errors

**Error:**
```
Timeout waiting for response
Request timeout after 30s
```

**Causes:**
- Database query too slow
- Network latency
- Server overloaded

**Solution:**
1. Check query performance
2. Use pagination for large datasets
3. Add timeouts in frontend:
```javascript
// In api.js
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000  // 10 seconds
});
```

---

## Debugging Tools

### Test API Health
```bash
curl -v https://profitpulse-ihv0.onrender.com/health
```

### Check Backend Logs
- Render: Dashboard → Logs (live view)
- Contains: Errors, warnings, info messages

### Check Database
- Supabase: Dashboard → Project
- View tables, rows, execute SQL

### Browser DevTools
- **Console:** JavaScript errors, logs
- **Network:** API call details, response data
- **Storage:** Local storage, cookies

### Command Line Testing
```bash
# Backend is running?
curl http://localhost:5000/health

# Frontend is running?
curl http://localhost:5173

# Environment variables loaded?
echo $SUPABASE_URL
```

---

## FAQ

**Q: How do I reset my password?**
A: This uses Supabase authentication (not yet implemented). See deployment guide.

**Q: Why is the data outdated?**
A: Data is updated annually. Check Supabase `updated_at` field.

**Q: Can I use different database?**
A: Possible but requires code changes. See [ARCHITECTURE.md](ARCHITECTURE.md).

**Q: How do I contribute?**
A: Create pull request to GitHub repository.

---

## Getting Help

1. **Check logs first** - Most errors are in logs
2. **Test API directly** - Use curl to isolate issues
3. **Check documentation** - [ARCHITECTURE.md](ARCHITECTURE.md), [ENVIRONMENT_VARIABLES.md](ENVIRONMENT_VARIABLES.md)
4. **Search issues** - Check GitHub issues
5. **Create detailed issue** - Include logs, error message, steps to reproduce

---

**Last Updated:** March 2026  
**Last Verified:** All solutions tested on production
