import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { TrendingUp, AlertCircle, Info, ArrowLeft, Download, Star } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import apiService from '../services/api';
import { formatPercent, getRiskBadgeColor } from '../utils/helpers';
import LoadingSpinner from '../components/LoadingSpinner';

const Company = () => {
  const { ticker } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [companyData, setCompanyData] = useState(null);
  const [error, setError] = useState(null);
  const [isWatchlisted, setIsWatchlisted] = useState(false);
  
  useEffect(() => {
    loadCompanyData();
  }, [ticker]);
  
  const loadCompanyData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.getCompany(ticker);
      setCompanyData(data);
      setLoading(false);
    } catch (err) {
      console.error('Error loading company:', err);
      setError('Không thể tải dữ liệu công ty');
      setLoading(false);
    }
  };
  
  if (loading) {
    return <LoadingSpinner message="Đang tải thông tin công ty..." />;
  }
  
  if (error || !companyData) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-8 border border-gray-100 max-w-md w-full text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Lỗi tải dữ liệu</h2>
          <p className="text-gray-600 mb-6">{error || 'Không tìm thấy công ty'}</p>
          <button
            onClick={() => navigate('/screener')}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-lg shadow-md transition-all"
          >
            <ArrowLeft className="h-4 w-4" />
            Quay lại Screener
          </button>
        </div>
      </div>
    );
  }
  
  const { latest_prediction, profit_score_timeseries } = companyData;
  
  // Prepare chart data
  const chartData = profit_score_timeseries.map(item => ({
    year: item.year_t,
    profitScore: item.ProfitScore
  }));
  
  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 text-gray-700 hover:text-gray-900 font-medium transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Quay lại</span>
      </button>
      
      {/* Header Card with Gradient */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 rounded-2xl shadow-xl">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10 p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
            <div className="text-white">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl sm:text-4xl font-bold">{ticker}</h1>
                <button
                  onClick={() => setIsWatchlisted(!isWatchlisted)}
                  className="p-2 hover:bg-white/20 rounded-lg transition"
                >
                  <Star className={`h-6 w-6 ${isWatchlisted ? 'fill-yellow-400 text-yellow-400' : 'text-white'}`} />
                </button>
              </div>
              <p className="text-blue-100 text-sm sm:text-base">
                Phân tích chi tiết và dự báo lợi nhuận
              </p>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              <div className={`px-5 py-2.5 rounded-xl ${getRiskBadgeColor(latest_prediction.risk_level)} text-white font-semibold shadow-lg`}>
                Risk: {latest_prediction.risk_level}
              </div>
              <button className="px-4 py-2.5 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white font-medium rounded-xl flex items-center gap-2 transition">
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Tải báo cáo</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Modern Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="group relative overflow-hidden bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
          <div className="relative z-10 p-6">
            <div className="flex items-center justify-between mb-4">
              <TrendingUp className="h-8 w-8 text-white/90" />
              <div className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full">
                <span className="text-xs text-white font-medium">Chance</span>
              </div>
            </div>
            <p className="text-blue-100 text-sm font-medium mb-1">Xác suất lợi nhuận</p>
            <p className="text-4xl font-bold text-white">{formatPercent(latest_prediction.chance_percent)}</p>
            <p className="text-blue-100 text-xs mt-2">Năm tới</p>
          </div>
        </div>
        
        <div className="group relative overflow-hidden bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
          <div className="relative z-10 p-6">
            <div className="flex items-center justify-between mb-4">
              <Info className="h-8 w-8 text-white/90" />
              <div className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full">
                <span className="text-xs text-white font-medium">Year</span>
              </div>
            </div>
            <p className="text-purple-100 text-sm font-medium mb-1">Năm dự báo</p>
            <p className="text-4xl font-bold text-white">{latest_prediction.year_t1}</p>
            <p className="text-purple-100 text-xs mt-2">Kết quả dự kiến</p>
          </div>
        </div>
        
        <div className="group relative overflow-hidden bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 sm:col-span-2 lg:col-span-1">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
          <div className="relative z-10 p-6">
            <div className="flex items-center justify-between mb-4">
              <AlertCircle className="h-8 w-8 text-white/90" />
              <div className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full">
                <span className="text-xs text-white font-medium">Status</span>
              </div>
            </div>
            <p className="text-orange-100 text-sm font-medium mb-1">Borderline</p>
            <p className="text-4xl font-bold text-white">{latest_prediction.is_borderline ? 'Có' : 'Không'}</p>
            <p className="text-orange-100 text-xs mt-2">Gần ngưỡng phân loại</p>
          </div>
        </div>
      </div>
      
      {/* Status & Reason - Modern Style */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-indigo-500 px-6 py-4">
            <h3 className="text-lg font-bold text-white flex items-center">
              <Info className="h-5 w-5 mr-2" />
              Trạng thái
            </h3>
          </div>
          <div className="p-6">
            <p className="text-gray-700 leading-relaxed">{latest_prediction.status}</p>
          </div>
        </div>
        
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-4">
            <h3 className="text-lg font-bold text-white flex items-center">
              <AlertCircle className="h-5 w-5 mr-2" />
              Lý do đánh giá
            </h3>
          </div>
          <div className="p-6">
            <p className="text-gray-700 leading-relaxed">{latest_prediction.reason}</p>
          </div>
        </div>
      </div>
      
      {/* ProfitScore Timeseries Chart - Modern Style */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-cyan-500 to-blue-500 px-6 py-4">
          <h3 className="text-lg font-bold text-white flex items-center">
            <TrendingUp className="h-5 w-5 mr-2" />
            ProfitScore theo thời gian
          </h3>
        </div>
        <div className="p-6">
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="year" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                  border: 'none', 
                  borderRadius: '12px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }} 
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="profitScore" 
                stroke="#0ea5e9" 
                strokeWidth={3}
                name="ProfitScore"
                dot={{ r: 4, fill: '#0ea5e9' }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      {/* Drivers - Modern Cards */}
      {latest_prediction.drivers && latest_prediction.drivers.length > 0 && (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-green-500 to-emerald-500 px-6 py-4">
            <h3 className="text-lg font-bold text-white flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              Drivers chính (yếu tố ảnh hưởng)
            </h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {latest_prediction.drivers.map((driver, idx) => (
                <div key={idx} className="group relative overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 hover:from-blue-50 hover:to-indigo-50 rounded-xl p-4 border border-gray-200 hover:border-blue-300 transition-all duration-200">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 mb-1">{driver.friendly_name}</p>
                      <p className="text-sm text-gray-600">{driver.direction}</p>
                    </div>
                    <span className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-semibold shadow-sm ${
                      driver.impact === 'tích cực' 
                        ? 'bg-gradient-to-r from-green-500 to-green-600 text-white' 
                        : 'bg-gradient-to-r from-red-500 to-red-600 text-white'
                    }`}>
                      {driver.impact}
                    </span>
                  </div>
                </div>
            ))}
          </div>
          </div>
        </div>
      )}
      
      {/* Action Tips - Modern List */}
      {latest_prediction.action_tips && latest_prediction.action_tips.length > 0 && (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-indigo-500 px-6 py-4">
            <h3 className="text-lg font-bold text-white flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              Gợi ý hành động
            </h3>
          </div>
          <div className="p-6">
            <ul className="space-y-3">
              {latest_prediction.action_tips.map((tip, idx) => (
                <li key={idx} className="flex items-start group">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold mr-3 mt-0.5 group-hover:bg-indigo-600 transition">
                    {idx + 1}
                  </div>
                  <span className="text-gray-800 leading-relaxed">{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default Company;
