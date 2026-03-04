/**
 * API Service
 * Chức năng: Gọi các API endpoints của backend
 */

import axios from 'axios';

// API Base URL Configuration
// Production: Use Render backend URL (without /api prefix as routes handle it)
// Development: Use localhost
const API_BASE_URL = import.meta.env.VITE_API_URL || (
  import.meta.env.PROD 
    ? 'https://profitpulse-ihv0.onrender.com' 
    : 'http://localhost:5000'
);

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor để handle errors
api.interceptors.response.use(
  response => response,
  error => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

/**
 * API Service Object
 */
export const apiService = {
  
  // ===== META =====
  getMeta: async () => {
    const response = await api.get('/api/meta');
    return response.data;
  },

  // ===== SCREENER =====
  screener: async (filters) => {
    const params = new URLSearchParams();
    
    if (filters.year) params.append('year', filters.year);
    if (filters.risk) params.append('risk', filters.risk);
    if (filters.chance_min !== undefined) params.append('chance_min', filters.chance_min);
    if (filters.chance_max !== undefined) params.append('chance_max', filters.chance_max);
    if (filters.borderline) params.append('borderline', 'true');
    if (filters.limit) params.append('limit', filters.limit);
    
    const response = await api.get(`/api/screener?${params.toString()}`);
    return response.data;
  },

  // ===== COMPANY =====
  getCompany: async (ticker, year = null) => {
    const params = year ? `?year=${year}` : '';
    const response = await api.get(`/api/company/${ticker}${params}`);
    return response.data;
  },

  // ===== COMPARE =====
  compareCompanies: async (tickers, year) => {
    const response = await api.post('/api/compare', {
      tickers,
      year
    });
    return response.data;
  },

  // ===== SUMMARY =====
  getSummary: async (year = null) => {
    const params = year ? `?year=${year}` : '';
    const response = await api.get(`/api/summary${params}`);
    return response.data;
  },

  // ===== ALERTS =====
  getAlerts: async (params = {}) => {
    const query = new URLSearchParams();
    if (params.scope) query.append('scope', params.scope);
    if (params.year_from) query.append('year_from', params.year_from);
    if (params.year_to) query.append('year_to', params.year_to);
    if (params.rules) query.append('rules', params.rules);
    if (params.watchlist) query.append('watchlist', params.watchlist);
    const response = await api.get(`/api/alerts?${query.toString()}`);
    return response.data;
  },

  getTopRisk: async (n = 10) => {
    const response = await api.get(`/api/alerts/top-risk?n=${n}`);
    return response.data;
  },

  // ===== ABOUT =====
  getAbout: async () => {
    const response = await api.get('/api/about');
    return response.data;
  },

  // ===== HEALTH =====
  healthCheck: async () => {
    const response = await api.get('/health');
    return response.data;
  }
};

export default apiService;
