# 🚀 Render Deployment - Environment Variables

## ✅ SUPABASE_SECRET_KEY (Service Role Key)

**Copy key này và paste vào Render:**

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZtc3h2YnRtZmVrZ2J1d3hrbnRsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjUyNjIxMiwiZXhwIjoyMDg4MTAyMjEyfQ.af-vhKAV4uQTT9zHX7ZO-WjkoxW6_54io5kZDN66iQk
```

---

## 📋 Các bước cập nhật trên Render:

### 1. Vào Render Dashboard
- URL: https://dashboard.render.com/
- Chọn web service: **profitpulse**

### 2. Cập nhật Environment Variable
- Click tab **Environment** (bên trái)
- Tìm biến: **SUPABASE_SECRET_KEY**
- Click **Edit** (✏️)
- Xóa value cũ
- Paste key mới từ trên
- Click **Save Changes**

### 3. Đợi Redeploy
- Render sẽ tự động redeploy (2-3 phút)
- Kiểm tra logs để đảm bảo build thành công

### 4. Test API
```bash
# Health check
curl https://profitpulse.onrender.com/health

# Metadata
curl https://profitpulse.onrender.com/api/meta

# Companies
curl https://profitpulse.onrender.com/api/companies?limit=5
```

---

## ⚙️ Full Environment Variables trên Render:

```env
SUPABASE_URL=https://fmsxvbtmfekgbuwxkntl.supabase.co
SUPABASE_SECRET_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZtc3h2YnRtZmVrZ2J1d3hrbnRsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjUyNjIxMiwiZXhwIjoyMDg4MTAyMjEyfQ.af-vhKAV4uQTT9zHX7ZO-WjkoxW6_54io5kZDN66iQk
FLASK_ENV=production
```

---

## ✅ Checklist Deploy:

- [x] Key đã test local thành công (628 companies)
- [ ] Key đã update trên Render
- [ ] Deployment thành công (status: Live)
- [ ] `/health` endpoint trả về 200 OK
- [ ] `/api/meta` trả về company count
- [ ] `/api/companies` trả về danh sách
