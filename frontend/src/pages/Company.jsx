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
    if (ticker && ticker !== 'undefined') {
      loadCompanyData();
    } else {
      setError('Mã công ty không hợp lệ');
      setLoading(false);
    }
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
  
  // Map backend response (app.py with Supabase) to frontend structure
  // Backend /api/company/<ticker> returns:
  //   company: {ticker, symbol, company_name, exchange_name, gics_industry_name, founded_year, ...}
  //   latest_score: {year, profit_score, label_t, risk_level("Cao"/"Thấp"), percentile, pc1, pc2, pc3}
  //   timeseries: [{year, profitscore, label, percentile}]
  //   financial_data: [...]
  //   total_years: N
  const latestScore = companyData.latest_score || {};
  const timeseries = companyData.timeseries || [];
  const companyInfo = companyData.company || {};
  
  // Prepare chart data from timeseries
  const chartData = timeseries.map(item => ({
    year: item.year,
    profitScore: item.profitscore ?? item.profit_score ?? item.p_t ?? 0
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
                {companyInfo.company_name || companyData.ticker || 'Phân tích chi tiết và dự báo lợi nhuận'}
              </p>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              <div className={`px-5 py-2.5 rounded-xl ${getRiskBadgeColor(latestScore.risk_level || 'N/A')} text-white font-semibold shadow-lg`}>
                Risk: {latestScore.risk_level || 'N/A'}
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
                <span className="text-xs text-white font-medium">Score</span>
              </div>
            </div>
            <p className="text-blue-100 text-sm font-medium mb-1">ProfitScore</p>
            <p className="text-4xl font-bold text-white">{latestScore.profit_score?.toFixed(4) || 'N/A'}</p>
            <p className="text-blue-100 text-xs mt-2">Điểm năm {latestScore.year || 'N/A'}</p>
          </div>
        </div>
        
        <div className="group relative overflow-hidden bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
          <div className="relative z-10 p-6">
            <div className="flex items-center justify-between mb-4">
              <Info className="h-8 w-8 text-white/90" />
              <div className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full">
                <span className="text-xs text-white font-medium">Percentile</span>
              </div>
            </div>
            <p className="text-purple-100 text-sm font-medium mb-1">Phân vị năm</p>
            <p className="text-4xl font-bold text-white">{latestScore.percentile || 'N/A'}%</p>
            <p className="text-purple-100 text-xs mt-2">So với toàn thị trường</p>
          </div>
        </div>
        
        <div className="group relative overflow-hidden bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 sm:col-span-2 lg:col-span-1">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
          <div className="relative z-10 p-6">
            <div className="flex items-center justify-between mb-4">
              <AlertCircle className="h-8 w-8 text-white/90" />
              <div className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full">
                <span className="text-xs text-white font-medium">Data</span>
              </div>
            </div>
            <p className="text-orange-100 text-sm font-medium mb-1">Tổng năm dữ liệu</p>
            <p className="text-4xl font-bold text-white">{companyData.total_years || timeseries.length || 0}</p>
            <p className="text-orange-100 text-xs mt-2">Năm có dữ liệu PCA</p>
          </div>
        </div>
      </div>
      
      {/* Company Info Card */}
      {companyInfo.company_name && (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-indigo-500 px-6 py-4">
            <h3 className="text-lg font-bold text-white flex items-center">
              <Info className="h-5 w-5 mr-2" />
              Thông tin công ty
            </h3>
          </div>
          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Tên công ty</p>
              <p className="font-semibold text-gray-900">{companyInfo.company_name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Sàn giao dịch</p>
              <p className="font-semibold text-gray-900">{companyInfo.exchange_name || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Ngành (GICS)</p>
              <p className="font-semibold text-gray-900">{companyInfo.gics_industry_name || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Năm thành lập</p>
              <p className="font-semibold text-gray-900">{companyInfo.founded_year || 'N/A'}</p>
            </div>
          </div>
        </div>
      )}
      
      {/* ProfitScore Timeseries Chart - Modern Style */}
      {chartData.length > 0 && (
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
      )}
    </div>
  );
};

export default Company;
