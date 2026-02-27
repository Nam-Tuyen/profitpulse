import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Bell, Filter, RefreshCw, ArrowRight, Search } from 'lucide-react';
import apiService from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { useWatchlist } from '../hooks/useWatchlist';

const Alerts = () => {
  const navigate = useNavigate();
  const { watchlist } = useWatchlist();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [availableYears, setAvailableYears] = useState([]);
  
  const [filters, setFilters] = useState({
    scope: 'market',
    year_from: null,
    year_to: null,
    rules: ['risk_change', 'chance_drop', 'borderline']
  });
  
  const [selectedRules, setSelectedRules] = useState({
    risk_change: true,
    chance_drop: true,
    borderline: true,
    roa_decline: false,
    npm_decline: false
  });
  
  useEffect(() => {
    loadMeta();
  }, []);
  
  const loadMeta = async () => {
    try {
      const metaData = await apiService.getMeta();
      setAvailableYears(metaData.years || []);
      
      if (metaData.years && metaData.years.length >= 2) {
        const latest = metaData.years[metaData.years.length - 1];
        const earliest = metaData.years[0];
        setFilters(prev => ({
          ...prev,
          year_from: earliest,
          year_to: latest
        }));
        // Auto-load alerts
        handleGenerateAlerts({
          ...filters,
          year_from: earliest,
          year_to: latest
        });
      }
    } catch (error) {
      console.error('Error loading meta:', error);
    }
  };
  
  const handleGenerateAlerts = async (customFilters = null) => {
    try {
      setLoading(true);
      const searchFilters = customFilters || filters;
      
      // Build rules array from selected checkboxes
      const rules = Object.keys(selectedRules).filter(key => selectedRules[key]);
      
      const params = {
        scope: searchFilters.scope,
        year_from: searchFilters.year_from,
        year_to: searchFilters.year_to,
        rules: rules.join(',')
      };
      
      if (searchFilters.scope === 'watchlist' && watchlist.length > 0) {
        params.watchlist = watchlist.join(',');
      }
      
      const data = await apiService.getAlerts(params);
      setAlerts(data.alerts || []);
      setLoading(false);
    } catch (error) {
      console.error('Error generating alerts:', error);
      setAlerts([]);
      setLoading(false);
    }
  };
  
  const handleRuleToggle = (rule) => {
    setSelectedRules(prev => ({
      ...prev,
      [rule]: !prev[rule]
    }));
  };
  
  const getSeverityBadge = (severity) => {
    const colors = {
      high: 'bg-gradient-to-r from-red-500 to-red-600 text-white',
      medium: 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-white',
      low: 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
    };
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${colors[severity] || colors.medium}`}>
        {severity === 'high' ? 'Cao' : severity === 'medium' ? 'Trung bình' : 'Thấp'}
      </span>
    );
  };
  
  const getAlertTypeLabel = (type) => {
    const labels = {
      risk_change: 'Risk tăng',
      chance_drop: 'ProfitScore giảm',
      borderline: 'Borderline',
      roa_decline: 'ROA giảm liên tục',
      npm_decline: 'NPM giảm liên tục'
    };
    return labels[type] || type;
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-orange-600 via-red-600 to-pink-600 rounded-2xl shadow-xl p-6 sm:p-8">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2 flex items-center">
            <Bell className="h-10 w-10 mr-3" />
            Cảnh báo tự động
          </h1>
          <p className="text-orange-100 text-sm sm:text-base">
            Tự động nhắc "mã nào cần xem ngay" theo watchlist hoặc toàn thị trường
          </p>
        </div>
      </div>
      
      {/* Filter Panel */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-orange-500 to-red-500 px-6 py-4">
          <h2 className="text-lg font-bold text-white flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Thiết lập cảnh báo
          </h2>
        </div>
        
        <div className="p-6">
          {/* Scope Selection */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Phạm vi theo dõi
            </label>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setFilters(prev => ({ ...prev, scope: 'market' }))}
                className={`px-6 py-3 rounded-xl font-medium transition ${
                  filters.scope === 'market'
                    ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Toàn thị trường
              </button>
              <button
                onClick={() => setFilters(prev => ({ ...prev, scope: 'watchlist' }))}
                className={`px-6 py-3 rounded-xl font-medium transition ${
                  filters.scope === 'watchlist'
                    ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Chỉ Watchlist ({watchlist.length})
              </button>
            </div>
            {filters.scope === 'watchlist' && watchlist.length === 0 && (
              <p className="text-sm text-red-600 mt-2">
                Watchlist trống. Hãy thêm công ty vào watchlist từ trang Sàng lọc.
              </p>
            )}
          </div>
          
          {/* Year Range */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Khoảng năm phân tích
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Từ năm</label>
                <select
                  value={filters.year_from || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, year_from: Number(e.target.value) }))}
                  className="block w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
                >
                  {availableYears.map((year) => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Đến năm</label>
                <select
                  value={filters.year_to || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, year_to: Number(e.target.value) }))}
                  className="block w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
                >
                  {availableYears.map((year) => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          
          {/* Rules */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Loại cảnh báo (chọn nhiều)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="flex items-center p-3 bg-red-50 hover:bg-red-100 border-2 border-red-200 rounded-lg cursor-pointer transition">
                <input
                  type="checkbox"
                  checked={selectedRules.risk_change}
                  onChange={() => handleRuleToggle('risk_change')}
                  className="rounded text-red-600 focus:ring-red-500 mr-3"
                />
                <div>
                  <span className="text-sm font-medium text-gray-900">Risk đổi cấp</span>
                  <p className="text-xs text-gray-600">Low → High</p>
                </div>
              </label>
              
              <label className="flex items-center p-3 bg-orange-50 hover:bg-orange-100 border-2 border-orange-200 rounded-lg cursor-pointer transition">
                <input
                  type="checkbox"
                  checked={selectedRules.chance_drop}
                  onChange={() => handleRuleToggle('chance_drop')}
                  className="rounded text-orange-600 focus:ring-orange-500 mr-3"
                />
                <div>
                  <span className="text-sm font-medium text-gray-900">ProfitScore giảm mạnh</span>
                  <p className="text-xs text-gray-600">Giảm ≥ 0.15 điểm</p>
                </div>
              </label>
              
              <label className="flex items-center p-3 bg-yellow-50 hover:bg-yellow-100 border-2 border-yellow-200 rounded-lg cursor-pointer transition">
                <input
                  type="checkbox"
                  checked={selectedRules.borderline}
                  onChange={() => handleRuleToggle('borderline')}
                  className="rounded text-yellow-600 focus:ring-yellow-500 mr-3"
                />
                <div>
                  <span className="text-sm font-medium text-gray-900">Borderline bật</span>
                  <p className="text-xs text-gray-600">|P| &lt; 0.1</p>
                </div>
              </label>
              
              <label className="flex items-center p-3 bg-blue-50 hover:bg-blue-100 border-2 border-blue-200 rounded-lg cursor-pointer transition">
                <input
                  type="checkbox"
                  checked={selectedRules.roa_decline}
                  onChange={() => handleRuleToggle('roa_decline')}
                  className="rounded text-blue-600 focus:ring-blue-500 mr-3"
                />
                <div>
                  <span className="text-sm font-medium text-gray-900">ROA giảm 2 năm</span>
                  <p className="text-xs text-gray-600">Liên tục giảm</p>
                </div>
              </label>
              
              <label className="flex items-center p-3 bg-purple-50 hover:bg-purple-100 border-2 border-purple-200 rounded-lg cursor-pointer transition">
                <input
                  type="checkbox"
                  checked={selectedRules.npm_decline}
                  onChange={() => handleRuleToggle('npm_decline')}
                  className="rounded text-purple-600 focus:ring-purple-500 mr-3"
                />
                <div>
                  <span className="text-sm font-medium text-gray-900">NPM giảm 2 năm</span>
                  <p className="text-xs text-gray-600">Biên lợi nhuận giảm</p>
                </div>
              </label>
            </div>
          </div>
          
          {/* Generate Button */}
          <button
            onClick={() => handleGenerateAlerts()}
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white font-semibold rounded-xl shadow-lg transition-all disabled:opacity-50"
          >
            {loading ? (
              <>
                <RefreshCw className="h-5 w-5 animate-spin" />
                Đang tạo cảnh báo...
              </>
            ) : (
              <>
                <Bell className="h-5 w-5" />
                Tạo cảnh báo
              </>
            )}
          </button>
        </div>
      </div>
      
      {/* Alerts List */}
      {loading ? (
        <LoadingSpinner message="Đang phân tích dữ liệu..." />
      ) : (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">
                Danh sách cảnh báo: {alerts.length} mục
              </h3>
              <p className="text-sm text-gray-600">
                Sắp xếp theo năm mới nhất
              </p>
            </div>
          </div>
          
          {alerts.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {alerts.map((alert, idx) => (
                <div
                  key={idx}
                  className="px-6 py-4 hover:bg-gradient-to-r hover:from-orange-50 hover:to-red-50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-sm font-bold text-gray-900">
                          {alert.firm_id}
                        </span>
                        <span className="text-xs text-gray-500">
                          Năm {alert.year}
                        </span>
                        {getSeverityBadge(alert.severity)}
                        <span className="text-xs font-medium text-orange-600 bg-orange-100 px-2 py-1 rounded">
                          {getAlertTypeLabel(alert.alert_type)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700">
                        {alert.message}
                      </p>
                    </div>
                    <button
                      onClick={() => navigate(`/company/${alert.firm_id}`)}
                      className="flex-shrink-0 inline-flex items-center gap-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm font-medium rounded-lg shadow-sm transition"
                    >
                      Xem chi tiết
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <AlertTriangle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">
                Không có cảnh báo nào với điều kiện hiện tại
              </p>
              <p className="text-gray-500 text-sm mt-2">
                Thử điều chỉnh khoảng năm hoặc chọn thêm loại cảnh báo
              </p>
            </div>
          )}
        </div>
      )}
      
      {/* Info Box */}
      <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-6">
        <h4 className="text-sm font-bold text-blue-900 mb-2 flex items-center">
          <AlertTriangle className="h-4 w-4 mr-2" />
          Lưu ý quan trọng
        </h4>
        <p className="text-sm text-blue-800 leading-relaxed">
          <strong>Ý nghĩa:</strong> Cảnh báo giúp ưu tiên đọc báo cáo tài chính và theo dõi biến động chỉ tiêu. 
          Đây là công cụ hỗ trợ quyết định, không phải khuyến nghị mua/bán. 
          Luôn kết hợp với phân tích định tính và tin tức thị trường.
        </p>
      </div>
    </div>
  );
};

export default Alerts;
