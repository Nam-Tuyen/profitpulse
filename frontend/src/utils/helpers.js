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
