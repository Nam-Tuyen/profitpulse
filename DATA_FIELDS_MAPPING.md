# Supabase Database Schema - Comprehensive Field Mapping

**Cập nhật: 5 tháng 3, 2026**

---

## Tổng Quan Database

ProfitPulse sử dụng **Supabase PostgreSQL** với 4 bảng chính:

| Bảng | Mục đích | Số trường | Primary Key |
|------|----------|-----------|-------------|
| `companies` | Thông tin công ty | 4 | `symbol` |
| `financial_raw` | Dữ liệu tài chính thô | 7+ | `(firm_id, year)` |
| `index_scores` | Điểm số & phân tích PCA | 9+ | `(firm_id, year)` |
| `predictions` | Dự báo tương lai (optional) | 9+ | `(firm_id, year)` |

---

## 1. Bảng `companies` - Thông Tin Công Ty

**Mục đích**: Lưu trữ metadata về các công ty niêm yết

### Schema

| Trường | Kiểu | Nullable | Mô tả | Ví dụ |
|--------|------|----------|-------|-------|
| `symbol` | `VARCHAR` | No | Mã duy nhất (ticker.exchange) | `"FPT.HM"`, `"AAA.HN"` |
| `ticker` | `VARCHAR` | No | Mã cổ phiếu | `"FPT"`, `"AAA"`, `"HDB"` |
| `company_name` | `TEXT` | Yes | Tên đầy đủ công ty | `"FPT Corporation"` |
| `exchange_name` | `VARCHAR` | Yes | Sàn giao dịch | `"HoSE"`, `"HNX"`, `"UPCOM"` |

### Quan Hệ
- **Primary Key**: `symbol`
- **Foreign Key References**: 
  - `financial_raw.firm_id → companies.symbol`
  - `index_scores.firm_id → companies.symbol`
  - `predictions.firm_id → companies.symbol`

### API Mapping
```python
# Backend: database.py
db.get_companies()  # → List[Dict[str, Any]]
db.get_company_by_ticker(ticker)  # → Dict | None

# Frontend: api.js
apiService.getCompanies()  # → {companies: [...], count: 628}
```

### Sample Data
```json
{
  "symbol": "FPT.HM",
  "ticker": "FPT",
  "company_name": "Công ty Cổ phần FPT",
  "exchange_name": "HoSE"
}
```

---

## 2. Bảng `financial_raw` - Dữ Liệu Tài Chính

**Mục đích**: Lưu trữ các chỉ số tài chính thô theo năm

### Schema

| Trường | Kiểu | Nullable | Mô tả | Đơn vị | Phạm vi |
|--------|------|----------|-------|--------|---------|
| `firm_id` | `VARCHAR` | No | FK → companies.symbol | - | `"FPT.HM"` |
| `year` | `INTEGER` | No | Năm tài chính | - | `1999-2025` |
| `X1_ROA` | `FLOAT` | Yes | Return on Assets | % | `-100% ~ +100%` |
| `X2_ROE` | `FLOAT` | Yes | Return on Equity | % | `-200% ~ +200%` |
| `X3_ROC` | `FLOAT` | Yes | Return on Capital | % | `-100% ~ +100%` |
| `X4_EPS` | `FLOAT` | Yes | Earnings per Share | VND | `-10000 ~ +50000` |
| `X5_NPM` | `FLOAT` | Yes | Net Profit Margin | % | `-100% ~ +100%` |

### Constraints
- **Primary Key**: `(firm_id, year)`
- **Foreign Key**: `firm_id REFERENCES companies(symbol)`
- **Unique**: Mỗi công ty chỉ có 1 bản ghi/năm

### Chi Tiết Các Chỉ Số

#### X1_ROA (Return on Assets)
```
ROA = Lợi nhuận ròng / Tổng tài sản
```
- **Ý nghĩa**: Hiệu quả sử dụng tài sản để tạo lợi nhuận
- **Tốt**: ROA > 5%
- **Trung bình**: ROA 0-5%
- **Kém**: ROA < 0%

#### X2_ROE (Return on Equity)
```
ROE = Lợi nhuận ròng / Vốn chủ sở hữu
```
- **Ý nghĩa**: Lợi nhuận tạo ra từ vốn cổ đông
- **Tốt**: ROE > 15%
- **Trung bình**: ROE 5-15%
- **Kém**: ROE < 5%

#### X3_ROC (Return on Capital)
```
ROC = EBIT / (Tổng tài sản - Nợ ngắn hạn)
```
- **Ý nghĩa**: Hiệu quả sử dụng vốn đầu tư
- **Tốt**: ROC > 10%
- **Trung bình**: ROC 5-10%
- **Kém**: ROC < 5%

#### X4_EPS (Earnings per Share)
```
EPS = Lợi nhuận ròng / Số cổ phiếu lưu hành
```
- **Ý nghĩa**: Lợi nhuận trên mỗi cổ phiếu
- **Đơn vị**: VND/cổ phiếu
- **Xu hướng tăng**: Tốt

#### X5_NPM (Net Profit Margin)
```
NPM = Lợi nhuận ròng / Doanh thu
```
- **Ý nghĩa**: Tỷ suất lợi nhuận ròng
- **Tốt**: NPM > 10%
- **Trung bình**: NPM 3-10%
- **Kém**: NPM < 3%

### API Mapping
```python
# Backend: database.py
db.get_financial_data(ticker="FPT", year=2025)  
# → List[Dict] with all X1-X5 fields

# API Response
GET /api/financial?ticker=FPT&year=2025
{
  "financial_data": [
    {
      "firm_id": "FPT.HM",
      "year": 2025,
      "X1_ROA": 15.23,
      "X2_ROE": 22.45,
      "X3_ROC": 18.67,
      "X4_EPS": 8542.5,
      "X5_NPM": 12.34
    }
  ],
  "count": 1,
  "success": true
}
```

### Sample Data
```json
{
  "firm_id": "FPT.HM",
  "year": 2025,
  "X1_ROA": 15.23,
  "X2_ROE": 22.45,
  "X3_ROC": 18.67,
  "X4_EPS": 8542.5,
  "X5_NPM": 12.34
}
```

---

## 3. Bảng `index_scores` - Điểm Số & Phân Tích PCA

**Mục đích**: Lưu trữ kết quả phân tích PCA và dự báo rủi ro

### Schema

| Trường | Kiểu | Nullable | Mô tả | Phạm vi | Backend Alias |
|--------|------|----------|-------|---------|---------------|
| `firm_id` | `VARCHAR` | No | FK → companies.symbol | - | - |
| `year` | `INTEGER` | No | Năm dự báo | `1999-2025` | - |
| `p_t` | `FLOAT` | No | Profit Score (điểm lợi nhuận) | `-5 ~ +10` | → `profit_score` |
| `label_t` | `INTEGER` | No | Risk Label (nhãn rủi ro) | `0` or `1` | - |
| `pc1` | `FLOAT` | Yes | Principal Component 1 | `-10 ~ +10` | - |
| `pc2` | `FLOAT` | Yes | Principal Component 2 | `-10 ~ +10` | - |
| `pc3` | `FLOAT` | Yes | Principal Component 3 | `-10 ~ +10` | - |
| `percentile_year` | `FLOAT` | Yes | Phân vị trong năm | `0-100` | - |

### Constraints
- **Primary Key**: `(firm_id, year)`
- **Foreign Key**: `firm_id REFERENCES companies(symbol)`
- **Check**: `label_t IN (0, 1)` (0=Low Risk, 1=High Risk)
- **Check**: `percentile_year BETWEEN 0 AND 100`

### Chi Tiết Các Trường

#### `p_t` → `profit_score`
**Backend mapping**: Database lưu `p_t`, API trả về `profit_score`

```python
# database.py (line 166-168)
for row in all_results:
    if 'p_t' in row:
        row['profit_score'] = row['p_t']
```

- **Công thức**: Kết hợp tuyến tính của PC1, PC2, PC3
- **Ý nghĩa**: 
  - Score cao (> 3): Lợi nhuận xuất sắc
  - Score trung bình (0-3): Lợi nhuận ổn định
  - Score thấp (< 0): Lợi nhuận kém/thua lỗ
- **Phạm vi**: Thường từ -3 đến +9, có thể vượt ngoài

#### `label_t` - Risk Label
- **0**: Low Risk (Rủi ro thấp) - "Thấp"
- **1**: High Risk (Rủi ro cao) - "Cao"
- **Model**: XGBoost / Random Forest classifier
- **Input**: p_t, pc1, pc2, pc3, financial metrics

#### `pc1`, `pc2`, `pc3` - Principal Components
PCA từ 5 chỉ số tài chính:
```
PCA Input: [X1_ROA, X2_ROE, X3_ROC, X4_EPS, X5_NPM]
↓
PC1: ~45% variance (hiệu quả hoạt động tổng quát)
PC2: ~25% variance (cấu trúc vốn)
PC3: ~15% variance (quy mô & tăng trưởng)
```

#### `percentile_year` - Phân Vị Theo Năm
- **Tính toán**: Xếp hạng profit_score trong tất cả công ty cùng năm
- **Ý nghĩa**: 
  - 100: Top 1% (tốt nhất)
  - 75-99: Xuất sắc
  - 50-74: Trên trung bình
  - 25-49: Dưới trung bình
  - 0-24: Yếu

### API Mapping
```python
# Backend: database.py
db.get_index_scores(ticker="FPT", year=2025)
# → List[Dict] with all fields + profit_score alias

# API Endpoints using index_scores:
GET /api/company/FPT  # latest_score from index_scores
GET /api/screener?year=2025  # all index_scores for year
GET /api/summary?year=2025  # aggregate stats
POST /api/compare {"tickers": ["FPT", "AAA"]}  # scores field
GET /api/alerts  # filter by label_t=1
```

### Sample Data
```json
{
  "firm_id": "FPT.HM",
  "year": 2025,
  "p_t": 8.92,
  "profit_score": 8.92,
  "label_t": 0,
  "pc1": 7.54,
  "pc2": 2.18,
  "pc3": 0.87,
  "percentile_year": 99.8
}
```

---

## 4. Bảng `predictions` - Dự Báo Tương Lai

**Mục đích**: Lưu trữ dự báo cho các năm tương lai (optional)

### Schema
Giống với `index_scores`:

| Trường | Kiểu | Nullable | Mô tả |
|--------|------|----------|-------|
| `firm_id` | `VARCHAR` | No | FK → companies.symbol |
| `year` | `INTEGER` | No | Năm dự báo (future year) |
| `p_t` | `FLOAT` | No | Predicted profit score |
| `label_t` | `INTEGER` | No | Predicted risk label |
| `pc1`, `pc2`, `pc3` | `FLOAT` | Yes | Projected PCA components |
| `percentile_year` | `FLOAT` | Yes | Expected percentile |

### Khác Biệt Với `index_scores`
- `index_scores`: Dữ liệu lịch sử + hiện tại (1999-2025)
- `predictions`: Dự báo tương lai (2026+)
- **Trạng thái hiện tại**: Bảng có thể trống (chưa train model dự báo)

### API Mapping
```python
# Backend: database.py
db.get_predictions(ticker="FPT", year=2026)
# → List[Dict] or [] if empty

GET /api/predictions?ticker=FPT&year=2026
{
  "predictions": [...],  # may be []
  "count": 0,
  "success": true
}
```

---

## Mối Quan Hệ Giữa Các Bảng

```
companies (628 rows)
    ↓ symbol
    ├─→ financial_raw.firm_id (10,000+ rows)
    │   ├─ Chứa X1_ROA, X2_ROE, X3_ROC, X4_EPS, X5_NPM
    │   └─ Mỗi công ty x mỗi năm = 1 row
    │
    ├─→ index_scores.firm_id (10,000+ rows)
    │   ├─ Chứa profit_score, label_t, pc1-pc3
    │   ├─ Derived từ financial_raw qua PCA + ML
    │   └─ Backend API chủ yếu dùng bảng này
    │
    └─→ predictions.firm_id (0 rows - optional)
        └─ Future forecasts (not implemented yet)
```

### Data Flow
```
1. Raw Financial Data
   financial_raw: {firm_id, year, X1_ROA, X2_ROE, X3_ROC, X4_EPS, X5_NPM}
   ↓
2. PCA Transformation (offline processing)
   → PC1 (45% variance)
   → PC2 (25% variance)
   → PC3 (15% variance)
   ↓
3. Profit Score Calculation
   p_t = weighted_sum(PC1, PC2, PC3)
   ↓
4. Risk Classification (ML Model)
   label_t = XGBoost_predict(p_t, pc1, pc2, pc3, financial_metrics)
   ↓
5. Percentile Ranking
   percentile_year = rank(p_t) within each year
   ↓
6. Store in index_scores
   {firm_id, year, p_t, label_t, pc1, pc2, pc3, percentile_year}
```

---

## Backend API Field Mapping

### `/api/meta` - Metadata
**Source**: `companies`, `financial_raw`, `index_scores`
```json
{
  "companies": ["AAA", "FPT", ...],  // companies.ticker
  "total_companies": 628,            // COUNT(companies)
  "total_financial_records": 10000,  // COUNT(financial_raw)
  "years": [1999, ..., 2025],        // DISTINCT(financial_raw.year)
  "year_range": {
    "min": 1999,                     // MIN(year)
    "max": 2025                      // MAX(year)
  }
}
```

### `/api/company/<ticker>` - Company Detail
**Source**: `companies`, `index_scores`, `financial_raw`
```json
{
  "company": {                       // from companies table
    "ticker": "FPT",
    "symbol": "FPT.HM",
    "company_name": "FPT Corporation",
    "exchange_name": "HoSE"
  },
  "latest_score": {                  // from index_scores (latest year)
    "year": 2025,
    "profit_score": 8.92,            // p_t → profit_score
    "label_t": 0,
    "risk_level": "Thấp",            // derived from label_t
    "percentile": 99.8,
    "pc1": 7.54,
    "pc2": 2.18,
    "pc3": 0.87
  },
  "timeseries": [                    // from index_scores (all years)
    {
      "year": 2025,
      "profitscore": 8.92,
      "label": 0,
      "percentile": 99.8
    },
    ...
  ],
  "financial_data": [                // from financial_raw (limited)
    {
      "firm_id": "FPT.HM",
      "year": 2025,
      "X1_ROA": 15.23,
      "X2_ROE": 22.45,
      "X3_ROC": 18.67,
      "X4_EPS": 8542.5,
      "X5_NPM": 12.34
    }
  ],
  "total_years": 10
}
```

### `/api/screener` - Screen Companies
**Source**: `index_scores`
```json
{
  "results": [
    {
      "firm_id": "FPT.HM",           // index_scores.firm_id
      "profit_score": 8.92,           // index_scores.p_t
      "p_t": 8.92,                    // original field
      "label_t": 0,                   // index_scores.label_t
      "percentile_year": 99.8,        // index_scores.percentile_year
      "pc1": 7.54,                    // index_scores.pc1
      "pc2": 2.18,                    // index_scores.pc2
      "pc3": 0.87,                    // index_scores.pc3
      "year": 2025
    }
  ],
  "count": 50,
  "year": 2025
}
```

### `/api/summary` - Summary Statistics
**Source**: `index_scores` (aggregated)
```json
{
  "year": 2025,
  "summary": {
    "total_firms": 628,              // COUNT(DISTINCT firm_id)
    "high_risk_count": 150,          // COUNT WHERE label_t=1
    "low_risk_count": 478,           // COUNT WHERE label_t=0
    "avg_profit_score": 2.15,        // AVG(profit_score)
    "max_profit_score": 8.92,        // MAX(profit_score)
    "min_profit_score": -3.21        // MIN(profit_score)
  },
  "chart_data": {
    "risk_distribution": {           // GROUP BY label_t
      "High": 150,
      "Low": 478
    },
    "score_distribution": [          // Bucketing profit_score
      {"range": "< -1", "count": 10},
      {"range": "-1 ~ 0", "count": 45},
      ...
    ],
    "top_performers": [              // ORDER BY profit_score DESC LIMIT 10
      {"firm": "FPT.HM", "score": 8.92}
    ]
  },
  "top_companies": [...]             // Full details of top 10
}
```

### `/api/compare` - Compare Companies
**Source**: `companies`, `index_scores`, `financial_raw`
```json
{
  "comparison": [
    {
      "ticker": "FPT",
      "company": {...},              // from companies
      "financial": {...},            // from financial_raw (1 year)
      "scores": {                    // from index_scores (1 year)
        "firm_id": "FPT.HM",
        "year": 2025,
        "profit_score": 8.92,
        "label_t": 0,
        "pc1": 7.54,
        "pc2": 2.18,
        "pc3": 0.87,
        "percentile_year": 99.8
      }
    }
  ],
  "count": 3
}
```

### `/api/alerts` - Alert Generation
**Source**: `index_scores` (filtered by `label_t=1`)
```json
{
  "alerts": [
    {
      "firm_id": "AAA.HM",           // index_scores.firm_id
      "year": 2025,                  // index_scores.year
      "type": "risk_change",         // derived
      "severity": "high",            // based on label_t=1
      "message": "...",              // generated
      "profit_score": 1.23,          // index_scores.profit_score
      "percentile": 30               // index_scores.percentile_year
    }
  ],
  "count": 50,
  "year": 2025
}
```

### `/api/about` - Project Information
**Source**: `companies`, `financial_raw` (metadata only)
```json
{
  "project": "ProfitPulse",
  "version": "1.0.0",
  "methodology": {
    "metrics": ["ROA", "ROE", "ROC", "EPS", "NPM"],  // X1-X5 labels
    "models": ["PCA", "XGBoost"]
  },
  "stats": {
    "total_companies": 628,         // COUNT(companies)
    "total_records": 10000,         // COUNT(financial_raw)
    "year_range": {
      "min": 1999,
      "max": 2025
    }
  }
}
```

---

## Database Access Methods

### Backend Functions (database.py)
```python
# SupabaseDB Class Methods
db = get_db()

# Query companies
db.get_companies(limit=None) → List[Dict]
db.get_company_by_ticker(ticker) → Dict | None

# Query financial data
db.get_financial_data(ticker=None, year=None) → List[Dict]

# Query scores (main data source)
db.get_index_scores(ticker=None, year=None) → List[Dict]
# Note: Automatically adds profit_score alias for p_t

# Query predictions (may be empty)
db.get_predictions(ticker=None, year=None) → List[Dict]

# Utility
db.get_latest_year() → int
db.get_metadata() → Dict
```

### Query Patterns Examples
```python
# Get all companies
companies = db.query_table('companies', limit=100)

# Get company with filters
fpt = db.query_table('companies', 
                     filters={'ticker': 'FPT'})

# Get financial data for specific year
fin_2025 = db.query_table('financial_raw', 
                          filters={'firm_id': 'FPT.HM', 'year': 2025})

# Get index scores ordered by profit_score
top_scores = db.query_table('index_scores',
                            filters={'year': 2025},
                            order_by='-p_t',
                            limit=10)
```

---

## 5. Source Data: ProfitPulse_Tables.xlsx

**Mục đích**: File Excel trung gian sinh ra từ Jupyter notebook (pipeline PCA + Profit Score). Dùng để upload vào Supabase qua `scripts/supabase/upload_tables.py`.

### Cách tạo file

Chạy đoạn code Python (notebook Jupyter) → xuất `ProfitPulse_Tables.xlsx` với 2 sheet:

### Sheet `Table_1_Proxies` → Bảng `financial_raw`

| Cột trong Excel | Cột trong Supabase | Kiểu | Ghi chú |
|----------------|-------------------|------|---------|
| `Symbol` | `firm_id` | VARCHAR | Ví dụ: `NCT.HM`, `SLS.HN` |
| `Date` | `year` | INTEGER | Trích xuất phần năm từ `yyyy-12-31` |
| `ROA` | `X1_ROA` | FLOAT | Return on Assets |
| `ROE` | `X2_ROE` | FLOAT | Return on Equity |
| `ROC` | `X3_ROC` | FLOAT | Return on Capital |
| `EPS` | `X4_EPS` | FLOAT | Earnings per Share |
| `NPM` | `X5_NPM` | FLOAT | Net Profit Margin |

### Sheet `Table_2_ProfitScore` → Bảng `index_scores`

| Cột trong Excel | Cột trong Supabase | Kiểu | Ghi chú |
|----------------|-------------------|------|---------|
| `Symbol` | `firm_id` | VARCHAR | Ví dụ: `NCT.HM`, `SLS.HN` |
| `Date` | `year` | INTEGER | Trích xuất phần năm từ `yyyy-12-31` |
| `Profit Score` | `p_t` | FLOAT | Điểm lợi nhuận PCA |
| `Percentile` | `percentile_year` | FLOAT | Phân vị trong năm (0-100) |
| `Nhãn` | `label_t` | INTEGER | `"Tốt"` → `1` (Risk Cao), `"Kém"` → `0` (Risk Thấp) |

> **Lưu ý label_t**: Thesis dùng rule `P_t > 0 → label=1`. Trong hệ thống, `label_t=1` = **Risk Cao** (được hiển thị màu đỏ trên Screener và Home). Các công ty có điểm cao (P_t > 0) được phân loại là "Risk Cao" vì chúng nằm ở ngưỡng đáng chú ý theo mô hình.

> **Lưu ý pc1/pc2/pc3**: Bảng `index_scores` có cột `pc1`, `pc2`, `pc3` (nullable). Table_2 không xuất các cột này, nên chúng sẽ giữ giá trị cũ khi upsert. Nếu muốn cập nhật, cần thêm PC values vào Python pipeline và bổ sung vào Sheet Table_2.

### Script Upload

```bash
# Đặt ProfitPulse_Tables.xlsx vào thư mục gốc của project, sau đó chạy:
python scripts/supabase/upload_tables.py

# Hoặc chỉ định đường dẫn tuỳ chỉnh:
$env:TABLES_EXCEL_PATH = "C:\path\to\ProfitPulse_Tables.xlsx"
python scripts/supabase/upload_tables.py
```

Script sẽ:
1. Tự động thêm công ty mới vào bảng `companies` nếu chưa tồn tại
2. Upsert toàn bộ dữ liệu theo conflict key `(firm_id, year)` — cập nhật nếu đã có, thêm mới nếu chưa có
3. Dữ liệu mới ngay lập tức phản án trên biểu đồ **Home** (Top 10 table) và **Screener** (scatter chart) thông qua API `/api/summary` và `/api/screener`

### Data Flow mới (bổ sung)

```
ProfitPulse_Tables.xlsx
  ├── Table_1_Proxies  ──→  financial_raw  (firm_id, year, X1_ROA…X5_NPM)
  └── Table_2_ProfitScore ─→ index_scores  (firm_id, year, p_t, label_t, percentile_year)
                                  ↓
               /api/summary  →  Home: Top 10 table + score distribution chart
               /api/screener →  Screener: scatter chart + results table
```

---

## Data Statistics (Current Production)

| Metric | Value |
|--------|-------|
| Total Companies | 628 |
| Total Financial Records | ~10,000 |
| Year Range | 1999 - 2025 (27 years) |
| Average Records/Company | ~16 years |
| Exchanges Covered | HoSE, HNX, UPCOM |
| Database Size | ~50 MB |
| Response Time (avg) | <200ms |

---

## Field Availability Summary

### Companies Table (100% coverage)
- `ticker` - available in all 628 companies
- `symbol` - available in all 628 companies  
- `company_name` - available for most companies
- `exchange_name` - available for most companies

### Financial Raw (95%+ coverage)
- `X1_ROA` - 95%+ data coverage
- `X2_ROE` - 95%+ data coverage
- `X3_ROC` - 90%+ data coverage
- `X4_EPS` - 93%+ data coverage
- `X5_NPM` - 92%+ data coverage

### Index Scores (100% coverage when financial data exists)
- `p_t / profit_score` - computed for all records
- `label_t` - classified for all records
- `pc1, pc2, pc3` - computed for all records
- `percentile_year` - ranked for all records

---

## Update Frequency

| Data Type | Update Schedule | Source |
|-----------|----------------|--------|
| Financial Data | Quarterly | Company financial reports |
| Index Scores | After financial update | Recomputed via pipeline |
| Predictions | Not yet implemented | - |
| Companies Metadata | As needed | Stock exchange listings |

---

**Last Updated**: 5 tháng 3, 2026  
**Status**: **PRODUCTION** - Full database schema documented
