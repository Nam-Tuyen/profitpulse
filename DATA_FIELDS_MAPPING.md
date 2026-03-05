# Supabase Database Schema - Comprehensive Field Mapping

**Cập nhật: 5 tháng 3, 2026**

---

## Tổng Quan Database

ProfitPulse sử dụng **Supabase PostgreSQL** với các nhóm bảng sau:

### Bảng Dimension (lookup)
| Bảng | Mục đích | Primary Key |
|------|----------|-------------|
| `companies` | Thông tin công ty | `symbol` |
| `dim_exchange` | Danh sách sàn giao dịch | `exchange_id` |
| `dim_gics_industry` | Phân ngành GICS cấp ngành | `industry_id` |
| `dim_gics_sub_industry` | Phân ngành GICS cấp phụ ngành | `sub_industry_id` |
| `dim_trbc_industry` | Phân ngành TRBC | `trbc_id` |
| `dim_auditor` | Danh sách công ty kiểm toán | `auditor_id` |

### Bảng Dữ Liệu Chính
| Bảng | Mục đích | Primary Key | Trạng thái |
|------|----------|-------------|-----------|
| `financial_raw` | 5 proxy tài chính thô (ROA/ROE/ROC/EPS/NPM) | `(firm_id, year)` | ✅ Có dữ liệu |
| `proxies_raw` | Proxy thô (tên cột thân thiện) | `(firm_id, year)` | ✅ Có dữ liệu |
| `proxies_winsor` | Proxy sau winsorization | `(firm_id, year)` | ✅ Có dữ liệu |
| `winsor_bounds` | Giới hạn winsor per-column | `column_name` | ✅ Có dữ liệu |
| `index_scores` | Profit Score PCA + nhãn rủi ro | `(firm_id, year)` | ✅ Có dữ liệu |
| `forecast_dataset` | Dataset kết hợp proxy + PCA (training) | `(firm_id, year)` | ✅ Có dữ liệu |
| `predictions` | Dự báo năm gần nhất (baseline) | `(firm_id, year)` | ✅ Có dữ liệu |
| `qa_missing_company_symbols` | Firm-year thiếu ≥1 proxy | `(firm_id, year)` | ✅ Nếu có thiếu |

### Bảng Phân Tích Mô Hình
| Bảng | Mục đích | Trạng thái |
|------|----------|-----------|
| `pca_summary` | Thống kê mô hình PCA (eigenvalues, variance) | 📋 Manual upload |
| `model_performance` | Hiệu suất mô hình ML | 📋 Manual upload |
| `robustness_summary` | Kiểm tra độ bền vững mô hình | 📋 Manual upload |

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

## 4. Bảng `predictions` - Dự Báo / Baseline Năm Gần Nhất

**Mục đích**: Lưu trữ điểm Profit Score của năm gần nhất dùng làm baseline dự báo.  
Script `upload_profitpulse_tables.py` tự động điền bảng này bằng dữ liệu của `latest_year` từ `index_scores`.

### Schema

| Trường | Kiểu | Nullable | Mô tả |
|--------|------|----------|-------|
| `firm_id` | `VARCHAR` | No | FK → companies.symbol |
| `year` | `INTEGER` | No | Năm tham chiếu (năm mới nhất có dữ liệu) |
| `p_t` | `FLOAT` | No | Profit Score baseline |
| `label_t` | `INTEGER` | No | Risk label (0=thấp, 1=cao) |
| `pc1` | `FLOAT` | Yes | PC1 |
| `pc2` | `FLOAT` | Yes | PC2 |
| `pc3` | `FLOAT` | Yes | PC3 |
| `percentile_year` | `FLOAT` | Yes | Phân vị trong năm (0-100) |

### Khác Biệt Với `index_scores`
- `index_scores`: Tất cả các năm lịch sử (1999 → năm mới nhất)
- `predictions`: Chỉ năm gần nhất — dùng như "điểm tham chiếu dự báo"
- Khi có model ML dự báo tương lai, bảng này sẽ chứa predictions cho năm tiếp theo

### Upload
```bash
python scripts/supabase/upload_profitpulse_tables.py
# Tự động: predictions = index_scores WHERE year = max(year)
```

---

## 5. Bảng `forecast_dataset` - Dataset Huấn Luyện Mô Hình

**Mục đích**: Lưu trữ dataset đầy đủ (proxy + PCA) dùng để huấn luyện và kiểm tra mô hình dự báo.  
Đây là bảng kết hợp của `financial_raw` + `index_scores` trên cùng `(firm_id, year)`.

### Schema

| Trường | Kiểu | Nullable | Mô tả |
|--------|------|----------|-------|
| `firm_id` | `VARCHAR` | No | FK → companies.symbol |
| `year` | `INTEGER` | No | Năm tài chính |
| `x1_roa` | `FLOAT` | Yes | ROA (winsorized) |
| `x2_roe` | `FLOAT` | Yes | ROE (winsorized) |
| `x3_roc` | `FLOAT` | Yes | ROC (winsorized) |
| `x4_eps` | `FLOAT` | Yes | EPS (winsorized) |
| `x5_npm` | `FLOAT` | Yes | NPM (winsorized) |
| `pc1` | `FLOAT` | Yes | Principal Component 1 |
| `pc2` | `FLOAT` | Yes | Principal Component 2 |
| `pc3` | `FLOAT` | Yes | Principal Component 3 |
| `p_t` | `FLOAT` | No | Profit Score tổng hợp |
| `percentile_year` | `FLOAT` | Yes | Phân vị trong năm |
| `label_t` | `INTEGER` | No | Target label (0=thấp, 1=cao) |

### Constraints
- **Primary Key**: `(firm_id, year)`
- **Foreign Key**: `firm_id REFERENCES companies(symbol)`
- Chỉ chứa các firm-year **đủ cả 5 proxy** (đã dropna theo X_COLS)
- Sắp xếp theo `year` rồi `firm_id` (gom lại theo năm)

### Sử Dụng
```python
# Dùng để train model phân loại
X = forecast_dataset[['x1_roa','x2_roe','x3_roc','x4_eps','x5_npm','pc1','pc2','pc3']]
y = forecast_dataset['label_t']
# Train XGBoost / Random Forest / SVM trên tập train (year <= 2019)
```

### Upload
```bash
python scripts/supabase/upload_profitpulse_tables.py
# Tự động populate từ Data.xlsx
```

---

## 6. Bảng `qa_missing_company_symbols` - Kiểm Tra Thiếu Dữ Liệu

**Mục đích**: Ghi lại các firm-year có ít nhất 1 trong 5 proxy bị thiếu (NaN). Dùng để kiểm tra chất lượng dữ liệu và báo cáo mức độ coverage.

### Schema

| Trường | Kiểu | Nullable | Mô tả |
|--------|------|----------|-------|
| `firm_id` | `VARCHAR` | No | Mã công ty (có thể không tồn tại trong `companies`) |
| `year` | `INTEGER` | No | Năm tài chính |
| `x1_roa_missing` | `INTEGER` | Yes | 1 nếu ROA bị thiếu |
| `x2_roe_missing` | `INTEGER` | Yes | 1 nếu ROE bị thiếu |
| `x3_roc_missing` | `INTEGER` | Yes | 1 nếu ROC bị thiếu |
| `x4_eps_missing` | `INTEGER` | Yes | 1 nếu EPS bị thiếu |
| `x5_npm_missing` | `INTEGER` | Yes | 1 nếu NPM bị thiếu |

### Constraints
- **Primary Key**: `(firm_id, year)`
- **Không có FK** (firm may not be in `companies` table)
- Bảng trống nếu Data.xlsx không có row nào thiếu proxy

### Nguyên Nhân Thiếu Dữ Liệu Phổ Biến
- Công ty mới niêm yết chưa đủ báo cáo tài chính
- Dữ liệu năm đang cập nhật (year = current_year)
- EPS bị thiếu do chưa có cổ phiếu phát hành
- ROC bị thiếu khi `SH_ISS = 0` (chưa phát hành cổ phiếu)

### Upload
```bash
python scripts/supabase/upload_profitpulse_tables.py
# Tự động detect và upload nếu có row thiếu
```

---

## 7. Bảng `proxies_raw` & `proxies_winsor` - Proxy Thô Và Đã Winsor

### `proxies_raw` - Proxy Thô

| Trường | Kiểu | Nullable | Mô tả |
|--------|------|----------|-------|
| `firm_id` | `VARCHAR` | No | FK → companies.symbol |
| `year` | `INTEGER` | No | Năm tài chính |
| `roa` | `FLOAT` | Yes | Return on Assets (raw) |
| `roe` | `FLOAT` | Yes | Return on Equity (raw) |
| `roc` | `FLOAT` | Yes | Return on Capital (raw) |
| `eps` | `FLOAT` | Yes | Earnings per Share (raw) |
| `npm` | `FLOAT` | Yes | Net Profit Margin (raw) |

### `proxies_winsor` - Proxy Sau Winsor

| Trường | Kiểu | Nullable | Mô tả |
|--------|------|----------|-------|
| `firm_id` | `VARCHAR` | No | FK → companies.symbol |
| `year` | `INTEGER` | No | Năm tài chính |
| `roa_w` | `FLOAT` | Yes | ROA sau winsorization |
| `roe_w` | `FLOAT` | Yes | ROE sau winsorization |
| `roc_w` | `FLOAT` | Yes | ROC sau winsorization |
| `eps_w` | `FLOAT` | Yes | EPS sau winsorization |
| `npm_w` | `FLOAT` | Yes | NPM sau winsorization |

### `winsor_bounds` - Giới Hạn Winsor

| Trường | Kiểu | Nullable | Mô tả |
|--------|------|----------|-------|
| `column_name` | `VARCHAR` | No | Tên proxy (X1_ROA, ...) |
| `lower_bound` | `FLOAT` | No | Quantile dưới (q=0.01) |
| `upper_bound` | `FLOAT` | No | Quantile trên (q=0.99) |
| `quantile` | `FLOAT` | No | Giá trị q dùng (0.01) |

**Lưu ý**: Bounds được fit **chỉ trên tập train** (YEAR ≤ 2019), sau đó apply cho toàn bộ dữ liệu (leakage-safe).

---

## Mối Quan Hệ Giữa Các Bảng

```
companies (628 rows)
    ↓ symbol
    ├─→ financial_raw.firm_id (firm-year proxy thô X1-X5)
    ├─→ proxies_raw.firm_id   (firm-year proxy với tên đẹp)
    ├─→ proxies_winsor.firm_id (firm-year proxy đã winsor)
    ├─→ index_scores.firm_id  (firm-year Profit Score PCA)
    ├─→ forecast_dataset.firm_id (combined training set)
    └─→ predictions.firm_id   (latest year baseline)

qa_missing_company_symbols (không có FK constraint)
    → Firm-year thiếu ≥1 proxy, không nhất thiết có trong companies

winsor_bounds (standalone, 5 rows - 1 per proxy)
    → Bounds fit trên YEAR ≤ 2019
```

### Data Flow
```
Data.xlsx
   ↓ compute proxies
financial_raw / proxies_raw : {firm_id, year, X1_ROA...X5_NPM}
   ↓ winsorize (bounds from YEAR ≤ 2019)
proxies_winsor              : {firm_id, year, roa_w...npm_w}
   ↓ standardize (scaler from YEAR ≤ 2019)
   ↓ PCA (fit from YEAR ≤ 2019, transform all years)
PC1, PC2, PC3, P_t
   ↓ percentile rank within each year
   ↓ label_t = 1 if P_t > 0
index_scores                : {firm_id, year, p_t, label_t, pc1-3, percentile_year}
   ↓ join
forecast_dataset            : {firm_id, year, proxies + PCA scores + label}
   ↓ filter latest year
predictions                 : {firm_id, year=latest, p_t, label_t, ...}

1. Raw Financial Data
   financial_raw: {firm_id, year, X1_ROA, X2_ROE, X3_ROC, X4_EPS, X5_NPM}
   ↓
2. PCA Transformation (offline processing)
   → PC1 (~45% variance)
   → PC2 (~25% variance)
   → PC3 (~15% variance)
   ↓
3. Profit Score Calculation (leakage-safe: scaler+PCA fit on YEAR ≤ 2019)
   p_t = omega1*PC1 + omega2*PC2 + omega3*PC3  (omega = eigenvalue share)
   ↓
4. Risk Classification (rule-based)
   label_t = 1 if p_t > 0   (Risk Cao – profit score dương)
   label_t = 0 if p_t ≤ 0   (Risk Thấp – profit score âm/bằng 0)
   ↓
5. Percentile Ranking (within each YEAR)
   percentile_year = rank(p_t) / count(p_t) * 100
   ↓
6. Store in index_scores & forecast_dataset
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
- `label_t` - rule-based: 1 if p_t > 0, else 0
- `pc1, pc2, pc3` - computed for all records
- `percentile_year` - ranked within each year

### forecast_dataset (100% coverage = same as index_scores)
- Bao gồm tất cả proxy + PCA scores trong một bảng
- Dùng làm input dataset cho model training

### predictions (100% coverage = latest year only)
- Baseline prediction = index_scores của năm mới nhất

### qa_missing_company_symbols (coverage phụ thuộc dữ liệu)
- Chứa firm-year thiếu ≥1 proxy
- Trống nếu Data.xlsx đầy đủ dữ liệu

---

## Upload Script

```bash
# Tải dữ liệu từ Data.xlsx lên tất cả các bảng:
cd "C:\Users\NAM TUYEN LE\Downloads\Project code\profitpulse"
python scripts/supabase/upload_profitpulse_tables.py
```

Script sẽ upload theo thứ tự:
1. `financial_raw` — proxy thô (X1_ROA … X5_NPM)
2. `proxies_raw` — proxy với tên cột đẹp (roa … npm)
3. `proxies_winsor` — proxy sau winsorization
4. `winsor_bounds` — giới hạn winsor per-column
5. `index_scores` — Profit Score + label + PC1-PC3 + percentile
6. `forecast_dataset` — dataset kết hợp đầy đủ
7. `predictions` — năm mới nhất làm baseline
8. `qa_missing_company_symbols` — firm-year thiếu proxy

---

## Update Frequency

| Data Type | Update Schedule | Source | Script |
|-----------|----------------|--------|--------|
| Financial Data (proxies) | Quarterly | Company financial reports | `upload_profitpulse_tables.py` |
| Index Scores (PCA) | After financial update | Recomputed via pipeline | `upload_profitpulse_tables.py` |
| forecast_dataset | After index_scores update | Combined automatically | `upload_profitpulse_tables.py` |
| Predictions | After index_scores update | Latest year baseline | `upload_profitpulse_tables.py` |
| QA Missing | After each upload | Detected automatically | `upload_profitpulse_tables.py` |
| Companies Metadata | As needed | Stock exchange listings | `upload_data.py` |

---

**Last Updated**: 5 tháng 3, 2026  
**Status**: **PRODUCTION** - Full database schema documented (6 core tables + 3 auxiliary + lookup)
