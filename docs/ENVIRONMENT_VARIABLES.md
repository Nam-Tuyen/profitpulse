# Environment Variables Guide

Complete reference for all environment variables used in ProfitPulse.

## Environment Variables Overview

ProfitPulse uses environment variables for configuration in different deployment environments.

```
Local Development (.env)
       ↓
Running on localhost:5000 (backend) + localhost:5173 (frontend)

       ↓ Push to GitHub

Production on Render & Vercel
       ↓ Environment Variables
       ├─ Render Dashboard (Backend)
       └─ Vercel Dashboard (Frontend)
```

## Backend Environment Variables

### Required for All Environments

#### SUPABASE_URL
- **Description:** Supabase project URL
- **Format:** `https://{project-id}.supabase.co`
- **Example:** `https://fmsxvbtmfekgbuwxkntl.supabase.co`
- **Where to find:** Supabase Dashboard → Project Settings → API
- **Required in:** Render (production), Local (if using Supabase)

#### SUPABASE_SECRET_KEY
- **Description:** Service role key for backend database access
- **Format:** JWT token (starts with `eyJ`)
- **Length:** 220 characters
- **Example:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFz...`
- **Security:** WARNING: Contains full database access - keep secret!
- **Where to find:** Supabase Dashboard → Project Settings → API → Service Role Key
- **Required in:** Render (production), Local (if using Supabase)
- **Never:** Commit to Git, share in public, use in frontend

### Optional for Backend

#### FLASK_ENV
- **Description:** Flask running environment
- **Values:** `development`, `production`, `testing`
- **Default:** `production`
- **Development:** More verbose logging, auto-reload
- **Production:** Optimized, strict error handling
- **Set in:** Local (development) or Render (production)

#### PORT
- **Description:** Backend server port
- **Default:** `5000`
- **Set in:** Local .env
- **Note:** Render assigns port automatically via $PORT environment variable

#### PYTHON_VERSION
- **Description:** Python runtime version
- **Value:** `3.12`
- **Set in:** Render (optional, defaults to 3.12)

## Frontend Environment Variables

### Required for Production

#### VITE_API_URL
- **Description:** Backend API base URL
- **Values:**
  - **Local:** `http://localhost:5000`
  - **Production:** `https://profitpulse-ihv0.onrender.com`
- **Used in:** `frontend/src/services/api.js`
- **Set in:** 
  - Local: `.env` or `frontend/.env.production`
  - Vercel: Environment Variables dashboard
- **Impact:** Frontend uses this to make API calls
- **Required:** Yes, for production deployment

#### VITE_DEBUG
- **Description:** Enable debug logging in frontend
- **Values:** `true` or `false`
- **Default:** `false`
- **Set in:** Local .env during development
- **Optional:** Yes

## Environment Files

### .env (Local Root)
Used for local development on your machine.

```bash
# Backend (Local)
SUPABASE_URL=https://fmsxvbtmfekgbuwxkntl.supabase.co
SUPABASE_SECRET_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
FLASK_ENV=development
PORT=5000

# Frontend (Local)
VITE_API_URL=http://localhost:5000
VITE_DEBUG=false

# Optional
ANALYTICS_ID=
SENTRY_DSN=
```

**Location:** Project root (NOT committed to Git)

### frontend/.env.production
Production environment for frontend build.

```bash
VITE_API_URL=https://profitpulse-ihv0.onrender.com
```

### .env.example
Template file (committed to Git) as reference.

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SECRET_KEY=your_service_role_key_here
FLASK_ENV=development
PORT=5000
VITE_API_URL=http://localhost:5000
```

**Location:** Project root (for developers to reference)

## Setup Instructions

### Step 1: Local Development

Create `.env` in project root:

```bash
cp .env.example .env
# Edit .env with your credentials
```

### Step 2: Render (Backend Production)

1. Go to: https://dashboard.render.com
2. Web Service: `profitpulse`
3. Settings → Environment Variables
4. Add:
   - `SUPABASE_URL`: `https://fmsxvbtmfekgbuwxkntl.supabase.co`
   - `SUPABASE_SECRET_KEY`: (220-char JWT key)
   - `FLASK_ENV`: `production`
5. Click Save
6. Render auto-redeploys

### Step 3: Vercel (Frontend Production)

1. Go to: https://vercel.com/dashboard
2. Project: `profitpulse`
3. Settings → Environment Variables
4. Add:
   - **Key:** `VITE_API_URL`
   - **Value:** `https://profitpulse-ihv0.onrender.com`
   - **Environments:** Check all (Production, Preview, Development)
5. Click Save
6. Go to Deployments → Latest → Redeploy

## Supabase Credentials

### Finding Your Keys

1. **Go to:** https://supabase.com/dashboard
2. **Select your project:** `profitpulse`
3. **Click:** Project Settings (gear icon)
4. **Go to:** API tab
5. **Copy:**
   - **SUPABASE_URL:** `Project URL`
   - **SUPABASE_SECRET_KEY:** `Service Role Key` (full access)
   - **SUPABASE_PUBLISHABLE_KEY:** `Anon Public Key` (limited access)

### Key Differences

| Key | Access Level | Use Case |
|-----|--------------|----------|
| Service Role | Full (bypass RLS) | Backend only (keep secret) |
| Anon Public | Limited (RLS enforced) | Frontend (if RLS configured) |

**Rule:** Never expose service role key in frontend!

## Security Best Practices

### DO

- Store sensitive keys in environment variables only
- Use Render/Vercel dashboards for secrets (encrypted at rest)
- Rotate keys periodically
- Use different keys for dev/prod
- Add `.env` to `.gitignore`
- Keep `SUPABASE_SECRET_KEY` private
- Use HTTPS for all connections

### DON'T

- [ ] Commit `.env` to Git
- [ ] Share credentials in Slack/Email
- [ ] Use same key for dev and production
- [ ] Expose service role key in frontend
- [ ] Put credentials in comments
- [ ] Log sensitive values
- [ ] Use weak or publicly known keys

## Troubleshooting

### Issue: "Missing Supabase credentials"

**Error:**
```
ValueError: Missing Supabase credentials in environment variables
```

**Causes:**
- `.env` file not created
- `SUPABASE_URL` or `SUPABASE_SECRET_KEY` not set
- Environment variables not exported

**Fix:**
```bash
# Check .env exists
cat .env

# Check variables are loaded
echo $SUPABASE_URL
echo $SUPABASE_SECRET_KEY

# Set if not automatically loaded
export SUPABASE_URL=your_url
export SUPABASE_SECRET_KEY=your_key
```

### Issue: "Invalid API key"

**Error:**
```
invalid_api_key: The API key is invalid or has expired
```

**Causes:**
- Wrong key (using Anon instead of Service Role)
- Key is outdated
- Typo in key

**Fix:**
1. Verify using Service Role Key (not Public Key)
2. Regenerate key in Supabase Dashboard if needed
3. Copy entire key (220 characters, no gaps)
4. Re-deploy with updated key

### Issue: "Cannot connect to backend"

**Frontend error in browser console:**
```
Failed to fetch from https://profitpulse-ihv0.onrender.com
```

**Causes:**
- `VITE_API_URL` not set on Vercel
- Backend not running
- URL typo

**Fix:**
1. Add `VITE_API_URL` to Vercel environment variables
2. Redeploy Vercel project
3. Verify backend is running: `curl https://profitpulse-ihv0.onrender.com/health`

## Reference Table

| Variable | Environment | Type | Required | Length |
|----------|-------------|------|----------|--------|
| `SUPABASE_URL` | All | String | Yes | ~50 |
| `SUPABASE_SECRET_KEY` | Backend only | String (JWT) | Yes | 220 |
| `FLASK_ENV` | Backend | String | No | <20 |
| `PORT` | Backend (local) | Int | No | 4-5 |
| `VITE_API_URL` | Frontend | String (URL) | Yes (prod) | 50+ |
| `VITE_DEBUG` | Frontend | Boolean | No | 5 |

## Cheatsheet

### Quick Local Setup
```bash
# Copy template
cp .env.example .env

# Edit with editor
nano .env
# Add your Supabase credentials

# Source environment
export $(cat .env | xargs)

# Verify
echo $SUPABASE_URL
```

### Quick Deploy Update
```bash
# For Render backend changes
# Edit .env on Render Dashboard
# Click Save → Auto-redeploys

# For Vercel frontend changes
# Edit Environment Variables on Vercel
# Go to Deployments → Redeploy Latest
```

---

**Last Updated:** March 2026  
**Version:** 1.0.0  
**Security Level:** High
