# 🔗 Hướng dẫn Kết nối Frontend ↔ Backend

## ✅ Trạng thái hiện tại

### Backend (Render) - ✅ HOẠT ĐỘNG
- **URL:** https://profitpulse-ihv0.onrender.com
- **Status:** Deployed successfully on Render
- **Test:** 
  ```bash
  curl https://profitpulse-ihv0.onrender.com/health
  # Response: {"status": "ok", "database": "Supabase PostgreSQL", ...}
  ```

### Frontend (Local) - ✅ ĐÃ CẤU HÌNH
- **API Configuration:** `frontend/src/services/api.js`
- **Backend URL:** Đã trỏ đúng đến Render
- **Environment:** `.env.production` đã setup đúng

---

## 🚀 Bước 1: Verify Cấu hình Frontend

### 1.1. Kiểm tra API Service
File: `frontend/src/services/api.js`

```javascript
const API_BASE_URL = import.meta.env.VITE_API_URL || (
  import.meta.env.PROD 
    ? 'https://profitpulse-ihv0.onrender.com'  // ✅ Đúng
    : 'http://localhost:5000'
);
```

**✅ Đã config đúng!** Frontend sẽ tự động dùng Render URL khi deploy production.

### 1.2. Environment Variables
File: `frontend/.env.production`

```env
VITE_API_URL=https://profitpulse-ihv0.onrender.com
```

**✅ Đã config đúng!**

---

## 🌐 Bước 2: Deploy Frontend lên Vercel

### 2.1. Kiểm tra Git Status
```bash
cd "/Users/namtuyen/Downloads/Project_code/Profit Pulse/ProfitPulse"
git status
```

Nếu có thay đổi chưa commit, hãy commit và push:
```bash
git add .
git commit -m "Update frontend configuration for Render backend"
git push origin main
```

### 2.2. Deploy trên Vercel

**Option A: Auto-deploy (Recommended)**
1. Vercel đã được kết nối với GitHub repository
2. Mỗi lần push lên `main`, Vercel tự động deploy
3. Đợi 1-2 phút để deployment hoàn tất

**Option B: Manual deploy**
1. Vào https://vercel.com/dashboard
2. Chọn project `profitpulse`
3. Click **"Redeploy"** để trigger manual deployment

### 2.3. Thêm Environment Variable trên Vercel (Important!)

1. Vào Vercel Dashboard → Project Settings → Environment Variables
2. Thêm variable:
   - **Key:** `VITE_API_URL`
   - **Value:** `https://profitpulse-ihv0.onrender.com`
   - **Environment:** Production, Preview, Development (check all)
3. Click **"Save"**
4. Click **"Redeploy"** để apply environment variable

---

## 🧪 Bước 3: Test Kết nối

### 3.1. Test Backend trực tiếp
```bash
# Health check
curl https://profitpulse-ihv0.onrender.com/health

# Get companies metadata
curl https://profitpulse-ihv0.onrender.com/api/meta

# Get company data (example: VNM)
curl https://profitpulse-ihv0.onrender.com/api/company/VNM
```

### 3.2. Test Frontend sau khi deploy

1. **Mở Vercel deployment URL** (ví dụ: https://profitpulse.vercel.app)

2. **Mở Browser DevTools** (F12)

3. **Kiểm tra Network tab:**
   - Reload trang
   - Xem các API calls
   - Tất cả requests nên trỏ đến: `https://profitpulse-ihv0.onrender.com`

4. **Kiểm tra Console tab:**
   - Không có lỗi CORS
   - Không có lỗi "Failed to fetch"
   - API responses trả về data đúng

### 3.3. Test các trang chính

- ✅ **Home page:** Load được thống kê tổng quan
- ✅ **Screener page:** Load được danh sách công ty
- ✅ **Company page:** Nhập ticker (VD: VNM) → hiển thị thông tin
- ✅ **Compare page:** So sánh nhiều công ty
- ✅ **About page:** Hiển thị thông tin về hệ thống

---

## 🐛 Troubleshooting

### Issue 1: CORS Error
```
Access to fetch at 'https://profitpulse-ihv0.onrender.com' from origin 'https://profitpulse.vercel.app' has been blocked by CORS policy
```

**Fix:** Backend đã enable CORS (`flask-cors`), check lại `backend/app.py`:
```python
from flask_cors import CORS
CORS(app)  # ✅ Đã có
```

### Issue 2: API returns 502 Bad Gateway
**Cause:** Render backend đang sleep (free plan)
**Fix:** Đợi 30-60 giây, Render sẽ wake up service

### Issue 3: Frontend không gọi đúng URL
**Check:**
1. Environment variable `VITE_API_URL` đã set trên Vercel chưa?
2. Đã redeploy sau khi thêm env variable chưa?
3. Inspect network tab để xem URL thực tế được gọi

### Issue 4: Data không hiển thị
**Debug:**
```javascript
// Mở DevTools Console, chạy:
fetch('https://profitpulse-ihv0.onrender.com/health')
  .then(r => r.json())
  .then(console.log)
```

---

## 📊 Architecture Overview

```
┌─────────────────┐
│   User Browser  │
│  (Anywhere)     │
└────────┬────────┘
         │
         │ HTTPS
         ▼
┌─────────────────────────┐
│   Frontend (Vercel)     │
│  profitpulse.vercel.app │
│  - React + Vite         │
│  - Static files         │
└────────┬────────────────┘
         │
         │ API Calls (HTTPS)
         │ https://profitpulse-ihv0.onrender.com
         ▼
┌─────────────────────────┐
│   Backend (Render)      │
│  profitpulse-ihv0       │
│  - Flask API            │
│  - Python 3.12          │
└────────┬────────────────┘
         │
         │ SQL Queries
         ▼
┌─────────────────────────┐
│   Database (Supabase)   │
│  fmsxvbtmfekgbuwxkntl   │
│  - PostgreSQL           │
│  - 15 tables, 38K rows  │
└─────────────────────────┘
```

---

## ✅ Checklist Hoàn thành

- [x] Backend deployed on Render
- [x] Frontend API config đúng URL
- [x] Environment variables setup
- [ ] Frontend deployed on Vercel
- [ ] Environment variables added to Vercel
- [ ] Test all pages working
- [ ] Verify data loading correctly

---

## 🎯 Next Steps

1. **Deploy frontend:** Push code lên GitHub hoặc manual deploy trên Vercel
2. **Add env vars:** Thêm `VITE_API_URL` trên Vercel Dashboard
3. **Test:** Kiểm tra tất cả trang hoạt động bình thường
4. **Monitor:** Theo dõi logs trên Render và Vercel

**Estimated time:** 5-10 phút để deploy và verify

---

## 📞 Support

Nếu gặp vấn đề:
1. Check Render logs: https://dashboard.render.com/web/profitpulse/logs
2. Check Vercel logs: https://vercel.com/dashboard → Project → Deployments
3. Test backend trực tiếp với curl commands
4. Check browser DevTools Console và Network tab
