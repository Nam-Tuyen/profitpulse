# Vercel Deployment Guide

## Environment Variables

Go to Vercel Dashboard → Your Project → Settings → Environment Variables

Add this variable:

```
Name: VITE_API_URL
Value: https://profitpulse-ihv0.onrender.com
Environment: Production
```

This tells the frontend where to find the backend API.

## Build Settings

Vercel should auto-detect these settings from vite.config.js:

- **Framework Preset:** Vite
- **Root Directory:** `frontend`
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Install Command:** `npm install`

## Deployment

1. Connect repository to Vercel
2. Set Root Directory to `frontend`
3. Add Environment Variable (see above)
4. Deploy

## API URL Configuration

The frontend uses this priority for API URL:

1. **VITE_API_URL** env var (if set in Vercel)
2. **Production default:** `https://profitpulse-ihv0.onrender.com` (hardcoded)
3. **Development:** `http://localhost:5000`

So even without setting VITE_API_URL, it will work with the hardcoded Render URL.

## Testing After Deploy

Visit your Vercel URL and check browser console. You should see:

```
✅ API calls to: https://profitpulse-ihv0.onrender.com
✅ GET /health: 200 OK
✅ GET /api/meta: returns company count
```

If you see errors, check:
1. Render backend is deployed and running
2. Render backend responds to: https://profitpulse-ihv0.onrender.com/health
3. Browser console shows correct API URL
