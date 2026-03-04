/**
 * Utils – Helper functions for ProfitPulse
 */

/* ============================================================
 * Formatting
 * ============================================================ */

export const formatPercent = (value, decimals = 1) => {
  if (value == null) return 'N/A';
  return `${Number(value).toFixed(decimals)}%`;
};

export const formatNumber = (value, decimals = 0) => {
  if (value == null) return 'N/A';
  return Number(value).toLocaleString('vi-VN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

export const safeNum = (val, decimals = 4) => {
  if (val == null || isNaN(val)) return 'N/A';
  return Number(val).toFixed(decimals);
};

/* ============================================================
 * Risk helpers
 * ============================================================ */

export const getRiskColorClass = (riskLevel) => {
  const map = {
    Thấp: 'risk-low', Low: 'risk-low',
    Vừa: 'risk-medium', Medium: 'risk-medium',
    Cao: 'risk-high', High: 'risk-high',
  };
  return map[riskLevel] || 'bg-gray-100 text-gray-800';
};

export const getRiskBadgeColor = (riskLevel) => {
  const map = {
    Thấp: 'bg-green-500', Low: 'bg-green-500',
    Vừa: 'bg-yellow-500', Medium: 'bg-yellow-500',
    Cao: 'bg-red-500', High: 'bg-red-500',
  };
  return map[riskLevel] || 'bg-gray-500';
};

export const getChanceColor = (chance) => {
  if (chance >= 70) return 'bg-green-500';
  if (chance >= 40) return 'bg-yellow-500';
  return 'bg-red-500';
};

/* ============================================================
 * Derived metrics (Section 9 of spec)
 * ============================================================ */

/** Extract short ticker from firm_id ("AAA.HM" → "AAA") */
export const tickerFromFirmId = (firmId) => {
  if (!firmId) return 'N/A';
  return firmId.split('.')[0];
};

/** Map label_t to human-readable risk text */
export const riskText = (labelT) => {
  if (labelT === 1 || labelT === '1') return 'Risk Cao';
  if (labelT === 0 || labelT === '0') return 'Risk Thấp';
  return 'N/A';
};

/** Risk badge styling from label_t */
export const riskBadge = (labelT) => {
  if (labelT === 1 || labelT === '1') {
    return { text: 'Risk Cao', className: 'bg-rose-500/15 text-rose-400 border border-rose-500/20' };
  }
  if (labelT === 0 || labelT === '0') {
    return { text: 'Risk Thấp', className: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' };
  }
  return { text: 'N/A', className: 'bg-white/5 text-muted border border-white/10' };
};

/** Percentile rank bucket */
export const rankBucket = (percentile) => {
  if (percentile == null) return 'N/A';
  if (percentile >= 90) return 'Top 10%';
  if (percentile >= 75) return 'Top 25%';
  if (percentile >= 50) return 'Top 50%';
  return 'Dưới 50%';
};

/** Percentile interpretation sentence */
export const percentileInterpretation = (percentile) => {
  if (percentile == null) return '';
  if (percentile >= 80) return 'Nhóm lợi nhuận mạnh';
  if (percentile >= 50) return 'Trung bình khá';
  return 'Yếu hơn phần lớn thị trường năm này';
};

/** Severity badge color */
export const severityColor = (severity) => {
  const map = {
    critical: 'bg-rose-500/15 text-rose-400',
    high: 'bg-orange-500/15 text-orange-400',
    medium: 'bg-amber-500/15 text-amber-400',
    low: 'bg-accent-500/15 text-accent-400',
  };
  return map[(severity || '').toLowerCase()] || 'bg-white/5 text-muted';
};

/* ============================================================
 * YoY calculations from timeseries
 * ============================================================ */

export const computeYoYDeltas = (timeseries) => {
  if (!timeseries || timeseries.length < 2) return timeseries || [];
  const sorted = [...timeseries].sort((a, b) => a.year - b.year);
  return sorted.map((cur, idx) => {
    if (idx === 0) return { ...cur, delta_score: null, delta_percentile: null, risk_flip: false };
    const prev = sorted[idx - 1];
    return {
      ...cur,
      delta_score:
        cur.profitscore != null && prev.profitscore != null
          ? cur.profitscore - prev.profitscore
          : null,
      delta_percentile:
        cur.percentile != null && prev.percentile != null
          ? cur.percentile - prev.percentile
          : null,
      risk_flip: cur.label != null && prev.label != null && cur.label !== prev.label,
    };
  });
};

/* ============================================================
 * General utilities
 * ============================================================ */

export const truncate = (text, maxLength = 50) => {
  if (!text) return '';
  return text.length <= maxLength ? text : text.substring(0, maxLength) + '...';
};

export const debounce = (func, wait) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

export const sortBy = (array, key, order = 'asc') => {
  return [...array].sort((a, b) => {
    const aVal = a[key];
    const bVal = b[key];
    if (aVal < bVal) return order === 'asc' ? -1 : 1;
    if (aVal > bVal) return order === 'asc' ? 1 : -1;
    return 0;
  });
};

/* ============================================================
 * localStorage helpers
 * ============================================================ */

export const storage = {
  get: (key, defaultValue = null) => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch {
      return defaultValue;
    }
  },
  set: (key, value) => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {/* noop */}
  },
  remove: (key) => {
    try {
      window.localStorage.removeItem(key);
    } catch {/* noop */}
  },
};

/* ============================================================
 * CSV Export
 * ============================================================ */

export const exportToCSV = (data, filename = 'export.csv') => {
  if (!data?.length) return;
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map((row) =>
      headers
        .map((h) => {
          const v = row[h];
          if (typeof v === 'string' && (v.includes(',') || v.includes('"')))
            return `"${v.replace(/"/g, '""')}"`;
          return v;
        })
        .join(',')
    ),
  ].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
};

/* ============================================================
 * PC Component Interpretation (static mapping from loadings)
 * ============================================================ */

export const PC_DESCRIPTIONS = {
  pc1: { label: 'PC1', desc: 'Chủ yếu phản ánh ROA, ROE, ROC, NPM – đại diện hiệu quả sinh lời cốt lõi.' },
  pc2: { label: 'PC2', desc: 'Chủ yếu phản ánh EPS – đại diện lợi nhuận trên mỗi cổ phiếu.' },
  pc3: { label: 'PC3', desc: 'Phản ánh sự tương tác EPS và NPM – đại diện chất lượng lợi nhuận.' },
};

/* ============================================================
 * Financial Metrics Formatting & Thresholds
 * ============================================================ */

/** Format VND for EPS */
export const formatVND = (value, decimals = 0) => {
  if (value == null || isNaN(value)) return 'N/A';
  return Number(value).toLocaleString('vi-VN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }) + ' ₫';
};

/** Compute proxy coverage percentage from financial proxy fields */
export const computeProxyCoverage = (financial) => {
  if (!financial) return 0;
  const proxies = ['roa', 'roe', 'roc', 'eps', 'npm'];
  const available = proxies.filter(p => financial[p] != null && !isNaN(financial[p])).length;
  return (available / proxies.length) * 100;
};

/** Compute historical coverage (years with all 5 proxies / total years) */
export const computeHistoricalCoverage = (financialSeries) => {
  if (!financialSeries || financialSeries.length === 0) return 0;
  const proxies = ['roa', 'roe', 'roc', 'eps', 'npm'];
  const completeYears = financialSeries.filter(f => {
    return proxies.every(p => f[p] != null && !isNaN(f[p]));
  }).length;
  return (completeYears / financialSeries.length) * 100;
};

/** Get missing proxy fields from financial data */
export const getMissingProxies = (financial) => {
  if (!financial) return ['ROA', 'ROE', 'ROC', 'EPS', 'NPM'];
  const proxies = [
    { key: 'roa', label: 'ROA' },
    { key: 'roe', label: 'ROE' },
    { key: 'roc', label: 'ROC' },
    { key: 'eps', label: 'EPS' },
    { key: 'npm', label: 'NPM' },
  ];
  return proxies.filter(p => financial[p.key] == null || isNaN(financial[p.key])).map(p => p.label);
};

/** Financial metric thresholds for badge classification */
export const FINANCIAL_THRESHOLDS = {
  roa: { good: 10, medium: 5 },   // ROA >= 10% tốt, >= 5% trung bình
  roe: { good: 15, medium: 8 },   // ROE >= 15% tốt, >= 8% trung bình
  roc: { good: 12, medium: 6 },   // ROC >= 12% tốt, >= 6% trung bình
  npm: { good: 10, medium: 5 },   // NPM >= 10% tốt, >= 5% trung bình
};

/** Get badge for financial metric based on thresholds */
export const getFinancialBadge = (metric, value) => {
  if (value == null || isNaN(value)) {
    return { text: 'N/A', className: 'bg-white/5 text-muted border border-white/10' };
  }
  
  const thresholds = FINANCIAL_THRESHOLDS[metric.toLowerCase()];
  if (!thresholds) {
    return { text: safeNum(value, 2), className: 'bg-white/5 text-white border border-white/10' };
  }
  
  if (value >= thresholds.good) {
    return { text: 'Tốt', className: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' };
  } else if (value >= thresholds.medium) {
    return { text: 'Trung bình', className: 'bg-amber-500/15 text-amber-400 border border-amber-500/20' };
  } else {
    return { text: 'Kém', className: 'bg-rose-500/15 text-rose-400 border border-rose-500/20' };
  }
};

/* ============================================================
 * Chart & Tooltip Captions (Standardized Keys)
 * ============================================================ */

export const CHART_CAPTIONS = {
  // Home page
  home_risk_distribution: 'Biểu đồ cho bạn biết tỷ trọng rủi ro cao và rủi ro thấp trong năm đang xem.',
  home_score_distribution: 'Biểu đồ cho bạn biết doanh nghiệp phân bố theo các mức điểm để thấy thị trường tập trung ở vùng mạnh hay vùng yếu.',
  home_top_companies: 'Bảng cho bạn thấy các doanh nghiệp nổi bật theo điểm lợi nhuận để chọn nhanh mã đáng theo dõi.',
  home_kpi_minmax: 'Các thẻ tổng quan giúp bạn nắm biên độ điểm số và tỷ trọng rủi ro của thị trường trong năm đang xem.',
  
  // Screener page
  screener_top10_chart: 'Biểu đồ cho bạn thấy 10 mã có điểm cao nhất trong danh sách đã lọc để chọn nhanh mã cần xem chi tiết.',
  screener_results_table: 'Bảng cho bạn xem danh sách mã thỏa điều kiện lọc kèm phân vị và nhãn rủi ro để mở trang doanh nghiệp khi cần.',
  screener_mini_stats: 'Thống kê nhanh giúp bạn biết danh sách lọc đang nghiêng về nhóm mạnh hay nhóm rủi ro cao.',
  
  // Company Overview
  company_percentile_bucket: 'Dải phân vị cho bạn biết doanh nghiệp đang đứng ở nhóm nào so với toàn thị trường trong năm đang xem.',
  company_drivers_pc: 'Biểu đồ cho bạn biết PC1 PC2 PC3 đang đóng góp mạnh nhất vào điểm lợi nhuận của năm đang chọn.',
  company_financial_snapshot: 'Bảng cho bạn thấy 5 chỉ số nền ở năm đang chọn để hiểu vì sao điểm cao hay thấp.',
  
  // Company History
  company_profitscore_trend: 'Biểu đồ cho bạn thấy điểm lợi nhuận tăng hay giảm qua các năm.',
  company_percentile_trend: 'Biểu đồ cho bạn thấy vị trí trong thị trường đang cải thiện hay suy giảm theo thời gian.',
  company_risk_label_chart: 'Biểu đồ cho bạn thấy năm nào doanh nghiệp đổi trạng thái rủi ro.',
  company_multiyear_table: 'Bảng cho bạn đối chiếu nhanh điểm phân vị và nhãn rủi ro theo từng năm.',
  
  // Company Drivers
  company_pc_breakdown: 'Biểu đồ cho bạn biết thành phần nào đang kéo điểm lên hoặc kéo điểm xuống nhiều nhất.',
  company_financial_trend: 'Biểu đồ cho bạn thấy ROA ROE ROC EPS NPM đang cải thiện hay suy giảm theo thời gian.',
  company_yoy_change: 'Bảng cho bạn thấy mức thay đổi so với năm trước để nhận ra biến động mạnh hay nhẹ.',
  
  // Compare page
  compare_profitscore_trend: 'Biểu đồ cho bạn thấy doanh nghiệp nào ổn định hơn và doanh nghiệp nào biến động mạnh theo chu kỳ.',
  compare_year_snapshot: 'Bảng cho bạn so nhanh điểm phân vị và nhãn rủi ro trong cùng một năm.',
  compare_financial_comparison: 'Bảng cho bạn thấy khác biệt về chỉ số nền để giải thích chênh lệch điểm.',
  
  // Alerts page
  alerts_severity_chart: 'Biểu đồ cho bạn biết số cảnh báo theo mức độ trong giai đoạn đang lọc.',
  alerts_table_feed: 'Danh sách cho bạn xem mã năm loại cảnh báo và nội dung diễn giải để quyết định kiểm tra thêm.',
  alerts_yoy_details: 'Chi tiết cảnh báo cho bạn thấy điểm và phân vị thay đổi bao nhiêu so với năm trước để ưu tiên kiểm tra.',
  
  // About page
  about_pipeline_diagram: 'Sơ đồ cho bạn hiểu luồng xử lý từ dữ liệu tài chính đến điểm và nhãn rủi ro theo đúng trình tự.',
  
  // ModelPerformance / Stability
  stability_market_chart: 'Biểu đồ cho bạn thấy điểm trung bình và tỷ trọng rủi ro thay đổi theo từng năm để đánh giá độ ổn định theo thời gian.',
  stability_metrics_table: 'Bảng cho bạn nắm thông số dữ liệu và bối cảnh đọc kết quả.',
};

export const METRIC_TOOLTIPS = {
  roa: 'ROA là hiệu quả tạo lợi nhuận trên tổng tài sản và giúp bạn biết doanh nghiệp dùng tài sản tốt đến mức nào.',
  roe: 'ROE là lợi nhuận tạo ra trên vốn chủ và giúp bạn đánh giá hiệu quả sử dụng vốn cổ đông.',
  roc: 'ROC là hiệu quả tạo lợi nhuận trên vốn đầu tư và giúp bạn xem chất lượng vận hành vốn.',
  eps: 'EPS là lợi nhuận trên mỗi cổ phiếu và giúp bạn theo dõi khả năng tạo lợi nhuận cho cổ đông theo thời gian.',
  npm: 'NPM là tỷ suất lợi nhuận ròng trên doanh thu và giúp bạn biết biên lợi nhuận của doanh nghiệp.',
  coverage_year: 'Huy hiệu độ phủ dữ liệu cho bạn biết năm này có đủ 5 chỉ số nền để đọc kết quả tự tin hơn.',
  coverage_historical: 'Độ phủ lịch sử cho bạn biết bao nhiêu năm có đủ dữ liệu để đánh giá xu hướng tin cậy hơn.',
};
