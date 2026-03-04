# 🔐 Environment Variables - Deployment Guide

## 📊 Kiến trúc hiện tại

```
Frontend (Vercel)  →  Backend (Render)  →  Database (Supabase)
```

### ✅ Backend có kết nối TRỰC TIẾP đến Supabase

**Code evidence:** `backend/database.py`
```python
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SECRET_KEY = os.getenv("SUPABASE_SECRET_KEY")

self.client: Client = create_client(SUPABASE_URL, SUPABASE_SECRET_KEY)
```

**Kết luận:** Backend sử dụng `supabase` Python client để kết nối trực tiếp đến Supabase PostgreSQL database qua REST API.

---

## 🚀 DEPLOYMENT 1: Backend trên Render (✅ Đã deploy)

### Environment Variables cần thiết:

| Variable | Value | Purpose |
|----------|-------|---------|
| `SUPABASE_URL` | `https://fmsxvbtmfekgbuwxkntl.supabase.co` | Supabase project URL |
| `SUPABASE_SECRET_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (220 chars) | Service role key (full access) |
| `FLASK_ENV` | `production` | Flask environment mode |

### Cách thêm trên Render:

1. Vào: https://dashboard.render.com/web/profitpulse
2. **Settings** → **Environment** → **Environment Variables**
3. Add/Edit các biến trên
4. Click **Save**
5. Render sẽ tự động redeploy

### Status hiện tại:
- ✅ Backend đang chạy: https://profitpulse-ihv0.onrender.com
- ✅ Kết nối Supabase thành công: 628 companies loaded
- ✅ API endpoints working

---

## 🌐 DEPLOYMENT 2: Frontend trên Vercel (✅ Đã deploy)

### Environment Variables cần thiết:

| Variable | Value | Purpose |
|----------|-------|---------|
| `VITE_API_URL` | `https://profitpulse-ihv0.onrender.com` | Backend API URL (Render) |

### Cách thêm trên Vercel:

1. Vào: https://vercel.com/dashboard
2. Chọn project **profitpulse**
3. **Settings** → **Environment Variables**
4. Add new variable:
   - **Key:** `VITE_API_URL`
   - **Value:** `https://profitpulse-ihv0.onrender.com`
   - **Environments:** ✅ Production ✅ Preview ✅ Development
5. Click **Save**
6. **Deployments** → **Redeploy** (latest deployment)

### Config file: `frontend/.env.production`
```env
VITE_API_URL=https://profitpulse-ihv0.onrender.com
```

### Status hiện tại:
- ✅ Frontend code đã cấu hình đúng
- ✅ CSP errors đã fix
- ⏳ Vercel auto-deploy sau khi push code

---

## ❓ NẾU MUỐN DEPLOY BACKEND LÊN VERCEL (Không khuyến nghị)

⚠️ **Lưu ý:** Hiện tại backend đang chạy tốt trên Render. Vercel hỗ trợ Python nhưng có giới hạn:
- Serverless functions (10s timeout)
- Cold start cao hơn Render
- Không phù hợp với Flask app lớn

### Nếu vẫn muốn thử:

**1. Tạo file `vercel.json` cho backend:**
```json
{
  "version": 2,
  "builds": [
    {
      "src": "backend/app.py",
      "use": "@vercel/python"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "backend/app.py"
    }
  ]
}
```

**2. Environment Variables trên Vercel (cho backend):**

| Variable | Value |
|----------|-------|
| `SUPABASE_URL` | `https://fmsxvbtmfekgbuwxkntl.supabase.co` |
| `SUPABASE_SECRET_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `FLASK_ENV` | `production` |
| `PYTHONPATH` | `backend` |

**3. Thêm `requirements.txt` ở project root** (Vercel yêu cầu)

**Khuyến nghị:** ❌ Không nên làm vậy. Giữ nguyên:
- Backend trên **Render** (tốc độ tốt, ổn định, free tier)
- Frontend trên **Vercel** (CDN nhanh, auto-deploy)

---

## 🔍 Tóm tắt Environment Variables

### Backend (Render) - 3 biến:
```bash
SUPABASE_URL=https://fmsxvbtmfekgbuwxkntl.supabase.co
SUPABASE_SECRET_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...  # 220 chars JWT
FLASK_ENV=production
```

### Frontend (Vercel) - 1 biến:
```bash
VITE_API_URL=https://profitpulse-ihv0.onrender.com
```

### Local Development (.env) - Đầy đủ:
```bash
# Backend (khi chạy local backend)
SUPABASE_URL=https://fmsxvbtmfekgbuwxkntl.supabase.co
SUPABASE_SECRET_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
FLASK_ENV=development
PORT=5000

# Frontend (khi chạy local frontend)
VITE_API_URL=http://localhost:5000
```

---

## 📦 Files Reference

| File | Purpose | Location |
|------|---------|----------|
| `.env` | Local environment variables (git-ignored) | Project root |
| `.env.example` | Template for .env | Project root |
| `frontend/.env.production` | Frontend production settings | Frontend folder |
| `backend/render.yaml` | Render deployment config | Backend folder |
| `vercel.json` | Vercel frontend config | Project root |

---

## ✅ Checklist Deploy

### Backend (Render):
- [x] SUPABASE_URL set
- [x] SUPABASE_SECRET_KEY set (220 chars JWT)
- [x] FLASK_ENV=production
- [x] Deployed and running
- [x] Supabase connection verified (628 companies)

### Frontend (Vercel):
- [x] VITE_API_URL set
- [x] Code pushed to GitHub
- [x] CSP configured correctly
- [x] API calls routing to Render backend

### Database (Supabase):
- [x] 15 tables created
- [x] 38K+ rows of data
- [x] Service role key working
- [x] Backend connecting successfully

---

## 🐛 Common Issues

### Issue: "Missing Supabase credentials"
**Cause:** Environment variables not set  
**Fix:** Add SUPABASE_URL and SUPABASE_SECRET_KEY to deployment platform

### Issue: "Cannot connect to database"
**Check:**
1. SUPABASE_SECRET_KEY is correct (220 characters JWT, starts with eyJ...)
2. SUPABASE_URL matches your project
3. No trailing slashes in URL
4. Service role key has full permissions

### Issue: Frontend can't reach backend
**Check:**
1. VITE_API_URL is set on Vercel
2. VITE_API_URL points to Render backend (not localhost)
3. Redeploy after adding environment variable
4. Check browser DevTools Network tab for actual URL being called

---

## 🔐 Security Notes

1. **Never commit `.env` to Git** (already in .gitignore ✅)
2. **Service role key** (`SUPABASE_SECRET_KEY`) bypasses RLS - chỉ dùng ở backend
3. **Publishable key** - an toàn để dùng ở frontend (nếu cần)
4. **Rotate keys** định kỳ trên Supabase Dashboard
5. **Use Supabase RLS** (Row Level Security) cho production security

---

## 📞 Support

- Render Dashboard: https://dashboard.render.com
- Vercel Dashboard: https://vercel.com/dashboard
- Supabase Dashboard: https://supabase.com/dashboard

**Current deployment status:** ✅ All systems operational
