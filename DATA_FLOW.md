# Luồng Dữ Liệu: Data.xlsx → Pipeline → API → Frontend Charts

## 📊 Tổng Quan

Hệ thống đã được kết nối hoàn chỉnh từ dữ liệu gốc (Data.xlsx) qua pipeline phân tích đến hiển thị biểu đồ trên frontend.

```
Data.xlsx (1.1MB)
    ↓
ProfitPulse Pipeline
    ↓
artifacts_profitpulse/
    ├── company_view.parquet (841KB)
    ├── predictions_all.parquet (390KB)
    ├── screener_2023.parquet (51KB)
    └── model_metrics.json (2KB)
    ↓
Backend API (Flask)
    ├── ProfitPulseAdapter
    └── Chart Data Generator
    ↓
Frontend (React + Recharts)
    └── Interactive Charts
```

---

## 📁 Dữ Liệu Nguồn: Data.xlsx

**Vị trí:** `/Users/namtuyen/Downloads/Project_code/final_thesis/Data.xlsx`
**Kích thước:** 1.1MB
**Nội dung:**
- Dữ liệu tài chính của 627 công ty
- Thời gian: 1998-2025 (28 năm)
- Các chỉ số: ROA, ROE, ROC, EPS, NPM
- Tổng: 9,727 records

---

## ⚙️ Giai Đoạn 1: Pipeline Processing

### 1.1 Chạy Pipeline

```bash
# Chạy pipeline để xử lý Data.xlsx
python backend/main.py pipeline --use-profitpulse --data Data.xlsx
```

### 1.2 Output

Pipeline tạo ra các artifacts trong `artifacts_profitpulse/`:

1. **company_view.parquet** (841KB)
   - Dữ liệu đầy đủ của 627 công ty
   - Bao gồm: FIRM_ID, YEAR, P_t, Label_t, X1-X5

2. **predictions_all.parquet** (390KB)
   - Tất cả predictions từ model
   - Scores và labels

3. **screener_2023.parquet** (51KB)
   - Dữ liệu đã lọc cho năm 2023
   - Top companies theo điểm

4. **model_metrics.json** (2KB)
   - Metrics của model: accuracy, AUC, F1
   - Config: x_cols, model_name

---

## 🔧 Giai Đoạn 2: Backend API

### 2.1 ProfitPulseAdapter

File: `backend/utils/profitpulse_adapter.py`

**Chức năng chính:**
```python
class ProfitPulseAdapter:
    def load_company_view() → DataFrame      # Load dữ liệu công ty
    def get_metadata() → dict                # Metadata cho API
    def get_summary_stats(year) → dict       # Thống kê tổng hợp
    def get_chart_data(year) → dict          # Dữ liệu cho biểu đồ
    def get_screener_data() → DataFrame      # Lọc công ty
    def get_company_data(ticker) → dict      # Chi tiết công ty
```

### 2.2 Chart Data Generator

Method: `get_chart_data(year=None)`

**Output Structure:**
```json
{
  "risk_distribution": {
    "High Risk": 8,
    "Low Risk": 10
  },
  "score_distribution": [
    {"range": "<0", "count": 10},
    {"range": "0-0.2", "count": 2},
    {"range": "0.2-0.4", "count": 1},
    ...
  ],
  "top_performers": [
    {"firm": "SLS.HN", "score": 4.2965},
    {"firm": "KTS.HN", "score": 3.8521},
    ...
  ],
  "yearly_trends": [
    {"year": 1998, "avg_score": -0.05, "high_risk_count": 120},
    {"year": 1999, "avg_score": -0.03, "high_risk_count": 115},
    ...
  ],
  "metrics_distribution": {
    "X1_ROA": {"mean": 0.0545, "median": 0.0421, "std": 0.0527},
    "X2_ROE": {"mean": 0.0945, "median": 0.0819, "std": 0.0616},
    ...
  }
}
```

### 2.3 API Endpoints

**`GET /api/summary?year={year}`**

Response:
```json
{
  "success": true,
  "summary": {
    "total_firms": 627,
    "high_risk_count": 8,
    "low_risk_count": 10,
    "avg_score": 0.1811
  },
  "chart_data": { ... }
}
```

---

## 🎨 Giai Đoạn 3: Frontend Charts

File: `frontend/src/pages/Home.jsx`

### 3.1 Thư viện: Recharts

```bash
npm install recharts@^2.10.3
```

### 3.2 Các Biểu Đồ Hiển Thị

#### 1. **Risk Distribution (Bar Chart)**
- Phân bố High Risk vs Low Risk
- Màu: Blue (#3b82f6)
- Chiều cao: 300px

#### 2. **Score Distribution (Bar Chart)**
- Histogram phân bố điểm dự báo
- 7 bins: <0, 0-0.2, 0.2-0.4, 0.4-0.6, 0.6-0.8, 0.8-1.0, >1.0
- Màu: Green (#22c55e)

#### 3. **Top Performers (Horizontal Bar Chart)**
- Top 10 công ty có điểm cao nhất
- Layout: vertical
- Màu: Purple (#8b5cf6)

#### 4. **Financial Metrics (Grouped Bar Chart)**
- 5 chỉ số: ROA, ROE, ROC, EPS, NPM
- 2 bars: Mean (Blue) và Median (Green)
- Legend: Trung bình, Trung vị

#### 5. **Yearly Trends (Line Chart)**
- Chỉ hiển thị khi xem "All Years"
- 2 trục Y:
  - Left: Điểm trung bình (Blue line)
  - Right: Số công ty high risk (Red line)
- 28 năm dữ liệu (1998-2025)

### 3.3 Code Example

```jsx
import { BarChart, Bar, LineChart, Line, ... } from 'recharts';

<ResponsiveContainer width="100%" height={300}>
  <BarChart data={chartData.risk_distribution}>
    <CartesianGrid strokeDasharray="3 3" />
    <XAxis dataKey="name" />
    <YAxis />
    <Tooltip />
    <Bar dataKey="value" fill="#3b82f6" />
  </BarChart>
</ResponsiveContainer>
```

---

## 🚀 Cách Sử Dụng

### Bước 1: Chạy Pipeline với Data.xlsx

```bash
cd /Users/namtuyen/Downloads/Project_code/final_thesis

# Kích hoạt virtual environment
source .venv/bin/activate

# Chạy pipeline
python backend/main.py pipeline --use-profitpulse --data Data.xlsx
```

**Output:**
```
✓ Data loaded: 9727 rows
✓ Features engineered: 5 metrics
✓ Model trained: 83.2% accuracy
✓ Predictions generated
✓ Artifacts saved to artifacts_profitpulse/
```

### Bước 2: Start Backend

```bash
python backend/main.py serve --port 5001
```

**Kiểm tra:**
```bash
curl http://localhost:5001/api/summary?year=2025 | python -m json.tool
```

### Bước 3: Start Frontend

```bash
cd frontend
npm run dev
```

**Truy cập:** http://localhost:3000

### Bước 4: Xem Charts

1. Mở trang Home
2. Chọn năm từ dropdown (hoặc All Years)
3. Xem 5 biểu đồ tương tác:
   - Risk Distribution
   - Score Distribution
   - Top Performers
   - Financial Metrics
   - Yearly Trends

---

## 📊 Thống Kê Dữ Liệu

### Từ Data.xlsx

| Metric | Value |
|--------|-------|
| Tổng companies | 627 |
| Tổng records | 9,727 |
| Năm | 1998-2025 (28 years) |
| Features | 5 (ROA, ROE, ROC, EPS, NPM) |
| File size | 1.1MB |

### Sau Pipeline

| File | Size | Records | Description |
|------|------|---------|-------------|
| company_view.parquet | 841KB | 9,727 | Full dataset |
| predictions_all.parquet | 390KB | 9,727 | All predictions |
| screener_2023.parquet | 51KB | 18 | Filtered 2023 |
| model_metrics.json | 2KB | - | Model metrics |

### Model Performance

| Metric | Value |
|--------|-------|
| Accuracy | 83.2% |
| AUC | 87.9% |
| F1 Score | 75.8% |
| Precision | 69.2% |
| Recall | 84.1% |

---

## 🔍 Kiểm Tra & Debug

### 1. Kiểm tra Data.xlsx

```bash
ls -lh Data.xlsx
# Should show: 1.1M
```

### 2. Kiểm tra Pipeline Output

```bash
ls -lh artifacts_profitpulse/
# Should show:
# company_view.parquet (841KB)
# predictions_all.parquet (390KB)
# screener_2023.parquet (51KB)
# model_metrics.json (2KB)
```

### 3. Test API Endpoints

```bash
# Health check
curl http://localhost:5001/health

# Meta data
curl http://localhost:5001/api/meta

# Summary with charts
curl "http://localhost:5001/api/summary?year=2025"

# All years (for trends)
curl http://localhost:5001/api/summary
```

### 4. Kiểm tra Frontend

Mở Browser Console (F12):
```javascript
// Should see no errors
// Check network tab for API calls
```

### 5. Test Charts Rendering

- ✅ Risk Distribution bar chart hiển thị
- ✅ Score Distribution histogram hiển thị
- ✅ Top Performers horizontal bars hiển thị
- ✅ Financial Metrics grouped bars hiển thị
- ✅ Yearly Trends line chart hiển thị (khi All Years)

---

## 🎯 Các Tính Năng Chart

### Tương Tác (Interactive)

1. **Hover Tooltips**
   - Hiển thị giá trị chính xác khi hover
   - Format: số, phần trăm

2. **Responsive**
   - Tự động scale với màn hình
   - Mobile-friendly

3. **Legend**
   - Click để hide/show series
   - Màu rõ ràng

4. **Year Selector**
   - Dropdown chọn năm
   - Update charts real-time

### Màu Sắc

| Chart | Color | Hex |
|-------|-------|-----|
| Risk Distribution | Blue | #3b82f6 |
| Score Distribution | Green | #22c55e |
| Top Performers | Purple | #8b5cf6 |
| Metrics Mean | Blue | #3b82f6 |
| Metrics Median | Green | #22c55e |
| Trends Score | Blue | #3b82f6 |
| Trends Risk | Red | #ef4444 |

---

## 📝 Tóm Tắt

✅ **Dữ liệu nguồn:** Data.xlsx (1.1MB, 627 firms, 28 years)
✅ **Pipeline:** ProfitPulse xử lý → artifacts_profitpulse/
✅ **Backend:** Flask API + ProfitPulseAdapter + Chart Data Generator
✅ **Frontend:** React + Recharts → 5 interactive charts
✅ **Kết nối:** Hoàn chỉnh end-to-end

**Luồng hoàn chỉnh:**
```
Data.xlsx → Pipeline → Parquet files → API → JSON → Charts
```

**Thời gian xử lý:**
- Pipeline: ~30 giây
- API response: <100ms
- Chart rendering: <500ms

**Kết quả:**
- Dashboard tương tác với 5 biểu đồ
- Real-time data từ Data.xlsx
- Phân tích 627 công ty qua 28 năm
- Model accuracy: 83.2%

---

## 🔗 Tài Liệu Liên Quan

- [DOCUMENTATION.md](DOCUMENTATION.md) - Hướng dẫn tổng quát
- [QUICK_START.md](QUICK_START.md) - Quick start guide
- [backend/README.md](backend/README.md) - Backend API docs
- [Recharts Documentation](https://recharts.org/) - Chart library docs

---

**Ngày cập nhật:** 27/02/2026
**Phiên bản:** 1.0
**Trạng thái:** ✅ Production Ready
