/**
 * API Service – ProfitPulse Frontend
 * All backend calls centralised here.
 */

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || (
  import.meta.env.PROD
    ? 'https://profitpulse-ihv0.onrender.com'
    : 'http://localhost:5000'
);

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

api.interceptors.response.use(
  (r) => r,
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

/* ============================================================
 * Normalise helpers (handle nested vs flat summary)
 * ============================================================ */
const normaliseSummary = (raw) => {
  const s = raw.summary || raw;
  return {
    total_firms: s.total_firms ?? s.total_companies ?? 0,
    total_companies: s.total_companies ?? s.total_firms ?? 0,
    avg_profit_score: s.avg_profit_score ?? null,
    max_profit_score: s.max_profit_score ?? null,
    min_profit_score: s.min_profit_score ?? null,
    high_risk_count: s.high_risk_count ?? 0,
    low_risk_count: s.low_risk_count ?? 0,
  };
};

/* ============================================================
 * Public API
 * ============================================================ */
export const apiService = {

  /* ----- META ----- */
  getMeta: async () => {
    const { data } = await api.get('/api/meta');
    return data;
  },

  /* ----- SCREENER ----- */
  screener: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.year) params.append('year', filters.year);
    if (filters.min_score != null) params.append('min_score', filters.min_score);
    if (filters.max_score != null) params.append('max_score', filters.max_score);
    if (filters.limit) params.append('limit', filters.limit);
    const { data } = await api.get(`/api/screener?${params.toString()}`);
    return data;
  },

  /* ----- COMPANY ----- */
  getCompany: async (ticker, year = null) => {
    if (!ticker || ticker === 'undefined') throw new Error('Ticker is required');
    const params = year ? `?year=${year}` : '';
    const { data } = await api.get(`/api/company/${ticker}${params}`);
    return data;
  },

  /* ----- FINANCIAL DATA (for P0.1) ----- */
  getFinancial: async (ticker, year = null) => {
    if (!ticker || ticker === 'undefined') throw new Error('Ticker is required');
    const params = new URLSearchParams();
    params.append('ticker', ticker);
    if (year) params.append('year', year);
    const { data } = await api.get(`/api/financial?${params.toString()}`);
    return data;
  },

  getFinancialSeries: async (ticker) => {
    if (!ticker || ticker === 'undefined') throw new Error('Ticker is required');
    const params = new URLSearchParams();
    params.append('ticker', ticker);
    const { data } = await api.get(`/api/financial?${params.toString()}`);
    return data;
  },

  /* ----- COMPARE ----- */
  compareCompanies: async (tickers, year) => {
    const { data } = await api.post('/api/compare', { tickers, year });
    return data;
  },

  /* ----- SUMMARY (normalised) ----- */
  getSummary: async (year = null) => {
    const params = year ? `?year=${year}` : '';
    const { data } = await api.get(`/api/summary${params}`);
    return {
      ...data,
      _normalised: normaliseSummary(data),
      chart_data: data.chart_data ?? null,
      top_companies: data.top_companies ?? [],
      year: data.year ?? year,
    };
  },

  /* ----- SUMMARIES (multi-year for P2.1) ----- */
  getSummaries: async (years) => {
    if (!years || !Array.isArray(years) || years.length === 0) {
      throw new Error('Years array is required');
    }
    const promises = years.map(year => apiService.getSummary(year));
    return Promise.all(promises);
  },

  /* ----- ALERTS ----- */
  getAlerts: async (params = {}) => {
    const q = new URLSearchParams();
    if (params.scope) q.append('scope', params.scope);
    if (params.year_from) q.append('year_from', params.year_from);
    if (params.year_to) q.append('year_to', params.year_to);
    if (params.rules) q.append('rules', params.rules);
    if (params.watchlist) q.append('watchlist', params.watchlist);
    const { data } = await api.get(`/api/alerts?${q.toString()}`);
    return data;
  },

  getTopRisk: async (n = 10) => {
    const { data } = await api.get(`/api/alerts/top-risk?n=${n}`);
    return data;
  },

  /* ----- ABOUT ----- */
  getAbout: async () => {
    const { data } = await api.get('/api/about');
    return data;
  },

  /* ----- HEALTH ----- */
  healthCheck: async () => {
    const { data } = await api.get('/health');
    return data;
  },
};

export default apiService;
