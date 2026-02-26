# ProfitScore - Phân tích & Dự báo Lợi nhuận Doanh nghiệp

Hệ thống phân tích và dự báo lợi nhuận doanh nghiệp sử dụng Machine Learning (SVM, Random Forest, XGBoost).

> **✅ Backend Fixed & Production Ready** (Feb 27, 2026)  
> - All type hints corrected (16 errors fixed)  
> - Unified CLI interface (`backend/main.py`)  
> - Comprehensive documentation (2,000+ lines)  
> 
> **Quick Start:** `python backend/main.py all --use-profitpulse`  
> **Full Guide:** [QUICK_START.md](QUICK_START.md) | [FIXES_COMPLETE.md](FIXES_COMPLETE.md)

## 🎯 Tính năng chính

### Backend (Python + Flask)
- ✅ **ML Pipeline hoàn chỉnh**: Data loading → Preprocessing → PCA → Labeling → Model Training → Prediction
- ✅ **Leakage-safe**: Winsorization và Standardization chỉ fit trên train set
- ✅ **ProfitScore**: Tính điểm tổng hợp từ 5 chỉ tiêu lợi nhuận (ROA, ROE, ROC, EPS, NPM)
- ✅ **3 Models**: SVM, Random Forest, XGBoost
- ✅ **Explanations**: Generate lý do và action tips tự động (không học thuật, dễ hiểu)
- ✅ **Cache system**: Lưu predictions vào parquet files để query nhanh

### Frontend (React + Vite)
- ✅ **5 Pages chính**:
  - 🏠 **Home**: Tổng quan, KPI cards, top risk tăng
  - 🔍 **Screener**: Sàng lọc công ty theo risk/chance
  - 📊 **Company**: Chi tiết công ty với charts và drivers
  - ⚖️ **Compare**: So sánh 2-5 công ty
  - 🚨 **Alerts**: Cảnh báo risk tăng mạnh
- ✅ **UI/UX thân thiện**: Tailwind CSS, responsive design
- ✅ **Real-time data**: Gọi API từ backend

## 📁 Cấu trúc Project

```
final_thesis/
├── backend/                 # Backend Python
│   ├── core/               # Core ML modules
│   │   ├── data_loader.py      # Load & align data
│   │   ├── preprocessing.py    # Winsorize & Standardize (train-only)
│   │   ├── pca_profitscore.py  # PCA & ProfitScore
│   │   ├── labeling.py         # Create labels t+1
│   │   ├── ml_models.py        # SVM/RF/XGB training & prediction
│   │   └── explanations.py     # Generate reasons & action tips
│   ├── utils/              # Utilities
│   │   └── cache_manager.py    # Query cache data
│   ├── cache/              # Cache directory (generated)
│   │   ├── predictions.parquet
│   │   ├── profit_scores.parquet
│   │   └── metadata.json
│   ├── pipeline.py         # Main pipeline script
│   ├── api_server.py       # Flask API server
│   └── app.py              # Legacy simple API (optional)
│
├── frontend/               # Frontend React
│   ├── src/
│   │   ├── components/         # Shared components
│   │   │   ├── Layout.jsx
│   │   │   ├── StatsCard.jsx
│   │   │   └── LoadingSpinner.jsx
│   │   ├── pages/             # Main pages
│   │   │   ├── Home.jsx
│   │   │   ├── Screener.jsx
│   │   │   ├── Company.jsx
│   │   │   ├── Compare.jsx
│   │   │   └── Alerts.jsx
│   │   ├── services/          # API service
│   │   │   └── api.js
│   │   ├── utils/             # Helper functions
│   │   │   └── helpers.js
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── public/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
│
├── Data.xlsx              # Data file
├── requirements.txt       # Python dependencies
├── .gitignore
└── README.md             # This file
```

## 🚀 Cài đặt & Chạy

### ⚡ Quick Start (One Command) ⭐

```bash
# In project root
cd /Users/namtuyen/Downloads/Project_code/final_thesis

# Run everything (pipeline + server)
python backend/main.py all --use-profitpulse --data Data.xlsx --port 5000

# In another terminal, start frontend
cd frontend && npm run dev
```

**Done!** Access app at http://localhost:3000

---

### 📋 Detailed Setup

### Bước 1: Clone & Setup

```bash
cd /Users/namtuyen/Downloads/Project_code/final_thesis
```

### Bước 2: Backend Setup

```bash
# Install Python dependencies
pip install -r requirements.txt

# Option A: Run everything at once (⭐ Recommended)
python backend/main.py all --use-profitpulse --data Data.xlsx

# Option B: Manual steps
# 1. Run ML pipeline to build cache (offline, run once)
python backend/main.py pipeline --use-profitpulse --data Data.xlsx

# 2. Start API server
python backend/main.py serve --port 5000
# Server at: http://localhost:5000
```

**CLI Help:**
```bash
python backend/main.py --help           # Main help
python backend/main.py pipeline --help  # Pipeline options
python backend/main.py serve --help     # Server options
```

### Bước 3: Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
# Frontend chạy tại: http://localhost:3000
```

## 🆕 ProfitPulse Pipeline (NEW!)

**Tại sao có 2 pipelines?**
- **Pipeline cũ** (`backend/pipeline.py`): Modular, dễ maintain, đã có API integration
- **Pipeline mới** (`backend/profitpulse_pipeline.py`): **Single-file, leakage-safe guarantee, build proxies từ raw data**

### ✨ Pipeline Mới có gì?

1. **Build Proxies từ Raw Data**
   - Tự động tính ROA, ROE, ROC, EPS, NPM từ raw financial data
   - Không cần data đã clean sẵn

2. **Leakage-Safe 100%**
   - Fit preprocessing trên predictor year ≤ 2019 ONLY
   - Đảm bảo không bao giờ leak test data vào train

3. **Complete App Views**
   - Screener view (risk, chance, reason, action tips)
   - Company time-series view (ProfitScore, proxies, PCs)
   - Alerts view (risk changes, borderline, chance drops)

4. **Built-in Explanations**
   - Rule-based reason generation (Vietnamese)
   - Action tips tự động

### 🚀 Chạy Pipeline Mới

```bash
# Test pipeline (outputs → artifacts_profitpulse_test/)
python test_profitpulse.py

# Production pipeline (outputs → artifacts_profitpulse/)
python backend/profitpulse_pipeline.py
```

### 📦 Outputs

Pipeline mới tạo ra:
- `company_view.parquet` - Time-series per company
- `screener_2023.parquet` - Screener data cho năm 2023
- `predictions_all.parquet` - All predictions (all models, all years)
- `model_metrics.json` - Model performance metrics
- `methodology_snapshot.json` - PCA & preprocessing metadata
- `alerts_2016_2023.parquet` - Risk alerts data

### 📖 Documentation

- **[MIGRATION_GUIDE.md](MIGRATION_GUIDE.md)** - So sánh chi tiết 2 pipelines, cách migrate
- **[ARTIFACTS_README.md](ARTIFACTS_README.md)** - Giải thích artifacts outputs, cách sử dụng

### 🔀 Chọn Pipeline nào?

| Tiêu chí | Pipeline Cũ | Pipeline Mới |
|----------|-------------|--------------|
| **Leakage-safe** | ⚠️ Partial | ✅ Full guarantee |
| **Build proxies** | ❌ No | ✅ Yes (ROA/ROE/ROC/EPS/NPM) |
| **Explanations** | 🟡 Basic | ✅ Rule-based + tips |
| **App views ready** | ❌ Manual | ✅ Auto export |
| **Code structure** | 🟢 Modular | 🟡 Monolithic |
| **API integration** | ✅ Ready | ⚠️ Needs update |

**Khuyến nghị**: Dùng **Pipeline Mới** cho development/testing để đảm bảo methodology chính xác.

## 📊 Dữ liệu

File **Data.xlsx** chứa các cột:
- **FIRM_ID**: Mã công ty
- **YEAR**: Năm
- **NI_AT**: Net Income / Total Assets (ROA proxy)
- **NI_P**: Net Income / Price (ROE proxy)
- **EPS_B**: Earnings Per Share
- **GP**: Gross Profit
- **REV**: Revenue
- **TA**: Total Assets
- **EQ_P**: Equity / Price
- **SH_ISS**: Share Issuance
- **GREV**: Growth Revenue

## 🔧 ML Pipeline

### 1. Data Flow
```
Data.xlsx 
  → Load & Align (X_t → Label_t+1)
  → Time Split (train/test by label year)
  → Winsorize (train-only fit)
  → Standardize (train-only fit)
  → PCA (train-only fit)
  → ProfitScore calculation
  → Labeling (positive/negative)
  → Model Training (SVM/RF/XGB)
  → Prediction & Explanation
  → Save to Cache
```

### 2. Key Concepts

**ProfitScore (P)**:
- Tổng hợp từ 5 chỉ tiêu lợi nhuận qua PCA
- Weights dựa trên Explained Variance Ratio (EVR)
- P = w1×PC1 + w2×PC2 + w3×PC3

**Risk Level**:
- **Thấp**: Chance ≥ 70%
- **Vừa**: 40% ≤ Chance < 70%
- **Cao**: Chance < 40%

**Borderline**:
- Công ty có Chance gần ngưỡng 50% (±10%)
- Dễ thay đổi trạng thái nếu chỉ tiêu biến động

## 📡 API Endpoints

### Core APIs

```bash
# 1. Meta info
GET /api/meta

# 2. Screener (filter companies)
GET /api/screener?year=2021&risk=Cao&chance_min=30

# 3. Company detail
GET /api/company/{ticker}?year=2021

# 4. Compare companies
POST /api/compare
Body: {"tickers": ["ABC", "XYZ"], "year": 2021}

# 5. Summary stats
GET /api/summary?year=2021

# 6. Top risk alerts
GET /api/alerts/top-risk?n=10

# 7. Health check
GET /health
```

## 💡 User Stories (Đã implement)

### 1. **Home Page**
- Xem tổng quan: số công ty, % outlook tốt, borderline count
- Thấy phân bố risk (Thấp/Vừa/Cao)
- Top 10 công ty risk tăng mạnh
- Quick actions: đi tới Screener hoặc Compare

### 2. **Screener**
- Lọc công ty theo: năm, risk level, chance range, borderline
- Xem bảng kết quả với risk, chance, status, lý do
- Export CSV
- Click vào công ty → Chi tiết

### 3. **Company Detail**
- Xem chance năm tới, risk level, borderline status
- Biểu đồ ProfitScore theo thời gian
- Drivers (3 yếu tố ảnh hưởng nhất)
- Action tips (gợi ý hành động)

### 4. **Compare**
- Chọn 2-5 công ty
- So sánh risk, chance, status, lý do
- Bảng so sánh rõ ràng

### 5. **Alerts**
- Top N công ty có risk tăng mạnh
- Hiển thị thay đổi Chance (%)
- Mức độ: Cần chú ý / Nghiêm trọng

## 🛠 Tech Stack

### Backend
- **Python 3.11+**
- **Flask**: Web framework
- **Pandas**: Data manipulation
- **Scikit-learn**: ML models (SVM, RF)
- **XGBoost**: Gradient boosting
- **PyArrow**: Parquet cache

### Frontend
- **React 18**: UI framework
- **Vite**: Build tool
- **React Router**: Routing
- **Axios**: HTTP client
- **Recharts**: Charts library
- **Tailwind CSS**: Styling
- **Lucide React**: Icons

## 📝 Notes

### Train-Only Fit (Leakage Prevention)
Tất cả preprocessing fit chỉ trên **train set**:
- Winsorization bounds (1%, 99%)
- Standardization params (mean, std)
- PCA components & loadings

Test set chỉ **transform** bằng params từ train.

### Cache Strategy
Pipeline chạy offline → sinh cache:
- `predictions.parquet`: Kết quả dự báo + explanations
- `profit_scores.parquet`: ProfitScore timeseries
- `metadata.json`: Metrics, PCA info, scaler params

API server chỉ query cache → **rất nhanh**, không retrain.

## 🎓 Credits

Developed as part of Financial Analysis thesis project.

---

**🚀 Ready to run!**

Backend: `python backend/api_server.py`  
Frontend: `cd frontend && npm run dev`
