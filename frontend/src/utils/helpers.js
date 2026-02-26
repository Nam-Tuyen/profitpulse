/**
 * Utils - Helper functions
 */

/**
 * Format số thành percentage string
 */
export const formatPercent = (value, decimals = 1) => {
  if (value === null || value === undefined) return 'N/A';
  return `${value.toFixed(decimals)}%`;
};

/**
 * Format số với dấu phẩy
 */
export const formatNumber = (value, decimals = 0) => {
  if (value === null || value === undefined) return 'N/A';
  return value.toLocaleString('vi-VN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
};

/**
 * Get risk color class
 */
export const getRiskColorClass = (riskLevel) => {
  const colors = {
    'Thấp': 'risk-low',
    'Vừa': 'risk-medium',
    'Cao': 'risk-high'
  };
  return colors[riskLevel] || 'bg-gray-100 text-gray-800';
};

/**
 * Get risk badge color
 */
export const getRiskBadgeColor = (riskLevel) => {
  const colors = {
    'Thấp': 'bg-green-500',
    'Vừa': 'bg-yellow-500',
    'Cao': 'bg-red-500'
  };
  return colors[riskLevel] || 'bg-gray-500';
};

/**
 * Get chance bar color
 */
export const getChanceColor = (chance) => {
  if (chance >= 70) return 'bg-green-500';
  if (chance >= 40) return 'bg-yellow-500';
  return 'bg-red-500';
};

/**
 * Truncate text
 */
export const truncate = (text, maxLength = 50) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

/**
 * Debounce function
 */
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Sort array of objects
 */
export const sortBy = (array, key, order = 'asc') => {
  return [...array].sort((a, b) => {
    const aVal = a[key];
    const bVal = b[key];
    
    if (aVal < bVal) return order === 'asc' ? -1 : 1;
    if (aVal > bVal) return order === 'asc' ? 1 : -1;
    return 0;
  });
};

/**
 * Local storage helpers
 */
export const storage = {
  get: (key, defaultValue = null) => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return defaultValue;
    }
  },
  
  set: (key, value) => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Error writing to localStorage:', error);
    }
  },
  
  remove: (key) => {
    try {
      window.localStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing from localStorage:', error);
    }
  }
};

/**
 * Export to CSV
 */
export const exportToCSV = (data, filename = 'export.csv') => {
  if (!data || data.length === 0) return;
  
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        // Escape commas and quotes
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',')
    )
  ].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
};
