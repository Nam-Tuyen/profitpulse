import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Download, RefreshCw, Star, AlertCircle } from 'lucide-react';
import apiService from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { useWatchlist } from '../hooks/useWatchlist';

const Screener = () => {
  const navigate = useNavigate();
  const { isInWatchlist, addToWatchlist, removeFromWatchlist } = useWatchlist();
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [availableYears, setAvailableYears] = useState([]);
  
  // Filters
  const [filters, setFilters] = useState({
    year: null,
    risk_high: true,
    risk_medium: true,
    risk_low: true,
    chance_min: 0,
    chance_max: 100,
    borderline_only: false,
    min_score: null,
    limit: 100
  });
  
  useEffect(() => {
    loadMeta();
  }, []);
  
  const loadMeta = async () => {
    try {
      const metaData = await apiService.getMeta();
      setAvailableYears(metaData.years);
      
      if (metaData.years.length > 0) {
        const latestYear = metaData.years[metaData.years.length - 1];
        setFilters(prev => ({ ...prev, year: latestYear }));
        // Auto search on load
        handleSearch({ ...filters, year: latestYear });
      }
    } catch (error) {
      console.error('Error loading meta:', error);
    }
  };
  
  const handleSearch = async (customFilters = null) => {
    try {
      setLoading(true);
      const searchFilters = customFilters || filters;
      const data = await apiService.screener(searchFilters);
      setResults(data.results || []);
      setLoading(false);
    } catch (error) {
      console.error('Error searching:', error);
      setLoading(false);
    }
  };
  
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };
  
  const handleReset = () => {
    const resetFilters = {
      year: availableYears[availableYears.length - 1],
      risk_high: true,
      risk_medium: true,
      risk_low: true,
      chance_min: 0,
      chance_max: 100,
      borderline_only: false,
      min_score: null,
      limit: 100
    };
    setFilters(resetFilters);
    handleSearch(resetFilters);
  };
  
  const handleExportCSV = () => {
    const csv = [
      ['Mã', 'Năm', 'Risk', 'ProfitScore', 'ROA', 'ROE', 'ROC', 'EPS', 'NPM'].join(','),
      ...results.map(r => [
        r.FIRM_ID,
        r.year,
        r.label === 1 ? 'High' : 'Low',
        r.score || 0,
        r.X1_ROA || '',
        r.X2_ROE || '',
        r.X3_ROC || '',
        r.X4_EPS || '',
        r.X5_NPM || ''
      ].join(','))
    ].join('\\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `screener_${filters.year}.csv`;
    link.click();
  };
  
  const getRiskLabel = (label) => {
    return label === 1 ? 'High' : 'Low';
  };
  
  const toggleWatchlist = (firmId) => {
    if (isInWatchlist(firmId)) {
      removeFromWatchlist(firmId);
    } else {
      addToWatchlist(firmId);
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Modern Header with Gradient */}
      <div className="relative overflow-hidden bg-gradient-to-br from-purple-600 via-pink-600 to-red-600 rounded-2xl shadow-xl p-6 sm:p-8">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
            Sàng lọc & Phân tích
          </h1>
          <p className="text-purple-100 text-sm sm:text-base">
            Lọc nhanh danh sách công ty theo Risk/ProfitScore để tạo shortlist ưu tiên
          </p>
        </div>
      </div>
      
      {/* Filters Card */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-500 to-purple-500 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center">
              <Filter className="h-5 w-5 mr-2" />
              Bộ lọc điều kiện
            </h2>
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white text-sm font-medium rounded-lg transition"
            >
              <RefreshCw className="h-4 w-4" />
              Reset
            </button>
          </div>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {/* Year */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Năm phân tích (t)
              </label>
              <select
                value={filters.year || ''}
                onChange={(e) => handleFilterChange('year', Number(e.target.value))}
                className="block w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
              >
                {availableYears.map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
            
            {/* Min Score */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                ProfitScore tối thiểu
              </label>
              <input
                type="number"
                step="0.1"
                value={filters.min_score || ''}
                onChange={(e) => handleFilterChange('min_score', e.target.value ? Number(e.target.value) : null)}
                className="block w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                placeholder="Tất cả"
              />
            </div>
            
            {/* Limit */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Số lượng kết quả
              </label>
              <select
                value={filters.limit}
                onChange={(e) => handleFilterChange('limit', Number(e.target.value))}
                className="block w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
              >
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={200}>200</option>
                <option value={500}>500</option>
              </select>
            </div>
          </div>
          
          {/* Risk checkboxes */}
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Mức Risk (checkbox)
            </label>
            <div className="flex flex-wrap gap-3">
              <label className="inline-flex items-center px-4 py-2 bg-red-50 hover:bg-red-100 border-2 border-red-200 rounded-lg cursor-pointer transition">
                <input
                  type="checkbox"
                  checked={filters.risk_high}
                  onChange={(e) => handleFilterChange('risk_high', e.target.checked)}
                  className="rounded text-red-600 focus:ring-red-500 mr-2"
                />
                <span className="text-sm font-medium text-red-700">High Risk</span>
              </label>
              
              <label className="inline-flex items-center px-4 py-2 bg-green-50 hover:bg-green-100 border-2 border-green-200 rounded-lg cursor-pointer transition">
                <input
                  type="checkbox"
                  checked={filters.risk_low}
                  onChange={(e) => handleFilterChange('risk_low', e.target.checked)}
                  className="rounded text-green-600 focus:ring-green-500 mr-2"
                />
                <span className="text-sm font-medium text-green-700">Low Risk</span>
              </label>
            </div>
          </div>
          
          {/* Search Button */}
          <div className="mt-6 flex gap-3">
            <button
              onClick={() => handleSearch()}
              disabled={loading}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg transition-all disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="h-5 w-5 animate-spin" />
                  Đang tìm...
                </>
              ) : (
                <>
                  <Search className="h-5 w-5" />
                  Tìm kiếm
                </>
              )}
            </button>
            
            <button
              onClick={handleExportCSV}
              disabled={results.length === 0}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white hover:bg-gray-50 border-2 border-gray-200 text-gray-700 font-semibold rounded-xl shadow-sm transition-all disabled:opacity-50"
            >
              <Download className="h-5 w-5" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>
          </div>
        </div>
      </div>
      
      {/* Results */}
      {loading ? (
        <LoadingSpinner message="Đang tìm kiếm..." />
      ) : (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="text-lg font-bold text-gray-900">
                Kết quả: {results.length} công ty
              </h3>
              <p className="text-sm text-gray-600">
                <strong>Cách dùng:</strong> Lọc theo Risk High hoặc ProfitScore thấp để tìm công ty cần xem kỹ
              </p>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Mã
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Risk
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    ProfitScore
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    ROA
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    ROE
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    NPM
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {results.map((row, idx) => {
                  const firmId = row.FIRM_ID;
                  const risk = getRiskLabel(row.label);
                  const inWatchlist = isInWatchlist(firmId);
                  
                  return (
                    <tr key={idx} className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-colors">
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className="text-sm font-bold text-gray-900">{firmId}</span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full ${
                          risk === 'High' 
                            ? 'bg-gradient-to-r from-red-500 to-red-600 text-white' 
                            : 'bg-gradient-to-r from-green-500 to-green-600 text-white'
                        }`}>
                          {risk}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className={`text-sm font-semibold ${row.score < 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {row.score?.toFixed(4) || '—'}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                        {row.X1_ROA?.toFixed(4) || '—'}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                        {row.X2_ROE?.toFixed(4) || '—'}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                        {row.X5_NPM?.toFixed(4) || '—'}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleWatchlist(firmId)}
                            className={`p-2 rounded-lg transition ${
                              inWatchlist 
                                ? 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200' 
                                : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                            }`}
                            title={inWatchlist ? 'Remove from watchlist' : 'Add to watchlist'}
                          >
                            <Star className={`h-4 w-4 ${inWatchlist ? 'fill-current' : ''}`} />
                          </button>
                          <button
                            onClick={() => navigate(`/company/${firmId}`)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-medium rounded-lg shadow-sm transition"
                          >
                            Xem
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            
            {results.length === 0 && (
              <div className="text-center py-12">
                <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Không tìm thấy kết quả phù hợp với bộ lọc</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Screener;
