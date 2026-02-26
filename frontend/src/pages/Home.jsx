import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, AlertTriangle, Search, ArrowRight, BarChart3 } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import apiService from '../services/api';
import { formatPercent, getRiskBadgeColor } from '../utils/helpers';
import StatsCard from '../components/StatsCard';
import LoadingSpinner from '../components/LoadingSpinner';

const COLORS = ['#ef4444', '#22c55e', '#3b82f6', '#eab308', '#8b5cf6', '#ec4899'];

const Home = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [topRisk, setTopRisk] = useState([]);
  const [selectedYear, setSelectedYear] = useState(null);
  const [availableYears, setAvailableYears] = useState([]);
  
  useEffect(() => {
    loadData();
  }, [selectedYear]);
  
  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load meta để lấy available years
      const metaData = await apiService.getMeta();
      setAvailableYears(metaData.years);
      
      // Set default year nếu chưa có
      if (!selectedYear && metaData.years.length > 0) {
        setSelectedYear(metaData.years[metaData.years.length - 1]);
        return; // Will trigger useEffect again
      }
      
      // Load summary
      const summaryData = await apiService.getSummary(selectedYear);
      setChartData(summaryData.chart_data || null);
      setSummary(summaryData.summary);
      
      // Load top risk
      const riskData = await apiService.getTopRisk(10);
      setTopRisk(riskData.results);
      
      setLoading(false);
    } catch (error) {
      console.error('Error loading home data:', error);
      setLoading(false);
    }
  };
  
  if (loading) {
    return <LoadingSpinner message="Đang tải dữ liệu..." />;
  }
  
  if (!summary) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
        <p className="text-gray-600">Không thể tải dữ liệu tổng quan</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Modern Page Header with Gradient Background */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 rounded-2xl shadow-xl p-6 sm:p-8">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="text-white">
            <h1 className="text-3xl sm:text-4xl font-bold mb-2">
              Dashboard Tổng quan
            </h1>
            <p className="text-blue-100 text-sm sm:text-base">
              Phân tích và dự báo lợi nhuận doanh nghiệp theo thời gian thực
            </p>
          </div>
          
          {/* Year Selector with Modern Style */}
          <div className="w-full sm:w-auto">
            <label className="block text-xs font-medium text-blue-100 mb-2">
              Năm dự báo
            </label>
            <select
              value={selectedYear || ''}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="block w-full sm:w-40 px-4 py-2.5 bg-white/20 backdrop-blur-lg border border-white/30 rounded-xl text-white font-medium shadow-lg focus:ring-2 focus:ring-white/50 focus:border-white/50 transition"
            >
              {availableYears.map((year) => (
                <option key={year} value={year} className="text-gray-900">
                  {year}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
      
      {/* Modern KPI Cards with Hover Effects */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="group relative overflow-hidden bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 p-6">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <TrendingUp className="h-8 w-8 text-white/90" />
              <div className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full">
                <span className="text-xs text-white font-medium">Total</span>
              </div>
            </div>
            <p className="text-blue-100 text-sm font-medium mb-1">Tổng số công ty</p>
            <p className="text-4xl font-bold text-white">{summary.total_firms}</p>
          </div>
        </div>
        
        <div className="group relative overflow-hidden bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 p-6">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <AlertTriangle className="h-8 w-8 text-white/90" />
              <div className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full">
                <span className="text-xs text-white font-medium">High</span>
              </div>
            </div>
            <p className="text-red-100 text-sm font-medium mb-1">Risk cao</p>
            <p className="text-4xl font-bold text-white">{summary.high_risk_count}</p>
            <p className="text-red-100 text-xs mt-2">Cảnh báo cần theo dõi</p>
          </div>
        </div>
        
        <div className="group relative overflow-hidden bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 p-6 sm:col-span-2 lg:col-span-1">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <TrendingUp className="h-8 w-8 text-white/90" />
              <div className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full">
                <span className="text-xs text-white font-medium">Low</span>
              </div>
            </div>
            <p className="text-green-100 text-sm font-medium mb-1">Risk thấp</p>
            <p className="text-4xl font-bold text-white">{summary.low_risk_count}</p>
            <p className="text-green-100 text-xs mt-2">Tình hình tốt</p>
          </div>
        </div>
      </div>
      
      {/* Charts Section with Modern Cards */}
      {chartData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Risk Distribution Chart */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300 p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg mr-3">
                  <BarChart3 className="h-5 w-5 text-white" />
                </div>
                <span>Phân bố Risk Level</span>
              </h2>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={Object.entries(chartData.risk_distribution || {}).map(([name, value]) => ({ name, value }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                    border: 'none', 
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }} 
                />
                <Bar dataKey="value" fill="url(#colorGradient)" radius={[8, 8, 0, 0]} />
                <defs>
                  <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.8}/>
                    <stop offset="100%" stopColor="#6366f1" stopOpacity={0.8}/>
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          {/* Score Distribution Chart */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300 p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center">
                <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg mr-3">
                  <BarChart3 className="h-5 w-5 text-white" />
                </div>
                <span>Phân bố Điểm dự báo</span>
              </h2>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData.score_distribution || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="range" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                    border: 'none', 
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }} 
                />
                <Bar dataKey="count" fill="url(#colorGradient2)" radius={[8, 8, 0, 0]} />
                <defs>
                  <linearGradient id="colorGradient2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.8}/>
                    <stop offset="100%" stopColor="#059669" stopOpacity={0.8}/>
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          {/* Top Performers Chart */}
          {chartData.top_performers && chartData.top_performers.length > 0 && (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300 p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center">
                  <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg mr-3">
                    <TrendingUp className="h-5 w-5 text-white" />
                  </div>
                  <span>Top 10 công ty điểm cao nhất</span>
                </h2>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData.top_performers.slice(0, 10)} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis type="number" tick={{ fontSize: 12 }} />
                  <YAxis dataKey="firm" type="category" width={80} tick={{ fontSize: 11 }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                      border: 'none', 
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }} 
                  />
                  <Bar dataKey="score" fill="url(#colorGradient3)" radius={[0, 8, 8, 0]} />
                  <defs>
                    <linearGradient id="colorGradient3" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                      <stop offset="100%" stopColor="#a78bfa" stopOpacity={0.8}/>
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
          
          {/* Financial Metrics Distribution */}
          {chartData.metrics_distribution && Object.keys(chartData.metrics_distribution).length > 0 && (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300 p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center">
                  <div className="p-2 bg-gradient-to-br from-orange-500 to-amber-500 rounded-lg mr-3">
                    <BarChart3 className="h-5 w-5 text-white" />
                  </div>
                  <span>Chỉ số tài chính trung bình</span>
                </h2>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={Object.entries(chartData.metrics_distribution).map(([name, stats]) => ({
                  name: name.replace('X1_', '').replace('X2_', '').replace('X3_', '').replace('X4_', '').replace('X5_', ''),
                  mean: stats.mean,
                  median: stats.median
                }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                      border: 'none', 
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }} 
                  />
                  <Legend />
                  <Bar dataKey="mean" fill="#3b82f6" name="Trung bình" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="median" fill="#22c55e" name="Trung vị" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
          
          {/* Yearly Trends (if available) */}
          {chartData.yearly_trends && chartData.yearly_trends.length > 1 && (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300 p-6 border border-gray-100 lg:col-span-2">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center">
                  <div className="p-2 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-lg mr-3">
                    <TrendingUp className="h-5 w-5 text-white" />
                  </div>
                  <span>Xu hướng theo năm</span>
                </h2>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData.yearly_trends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                  <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                      border: 'none', 
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }} 
                  />
                  <Legend />
                  <Line yAxisId="left" type="monotone" dataKey="avg_score" stroke="#3b82f6" strokeWidth={3} name="Điểm TB" dot={{ r: 4 }} />
                  <Line yAxisId="right" type="monotone" dataKey="high_risk_count" stroke="#ef4444" strokeWidth={3} name="Số risk cao" dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}
      
      {/* Top Risk Companies */}
      {topRisk && topRisk.length > 0 && (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-red-500 to-orange-500 px-6 py-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <h2 className="text-xl font-bold text-white flex items-center">
                <AlertTriangle className="h-6 w-6 mr-3" />
                Top công ty Risk cao
              </h2>
              <button
                onClick={() => navigate('/alerts')}
                className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white text-sm font-medium rounded-lg transition"
            >
              Xem tất cả
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                <tr>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Mã
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Năm
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Điểm Risk
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Hành động
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {topRisk.map((item, idx) => (
                  <tr key={idx} className="hover:bg-gradient-to-r hover:from-red-50 hover:to-orange-50 transition-colors duration-150">
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-bold text-gray-900">{item.FIRM_ID}</span>
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {item.year || 'N/A'}
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-semibold text-red-600">
                        {item.risk_score ? item.risk_score.toFixed(4) : 'N/A'}
                      </span>
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full ${
                        item.label === 1 
                          ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-sm' 
                          : 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-sm'
                      }`}>
                        {item.label === 1 ? 'High Risk' : 'Low Risk'}
                      </span>
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => navigate(`/company/${item.FIRM_ID}`)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-medium rounded-lg shadow-sm transition-all duration-200"
                      >
                        Chi tiết
                        <ArrowRight className="h-3 w-3" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <button
          onClick={() => navigate('/screener')}
          className="flex items-center justify-between p-6 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
        >
          <div className="flex items-center">
            <div className="p-3 bg-primary-100 rounded-lg">
              <Search className="h-6 w-6 text-primary-600" />
            </div>
            <div className="ml-4 text-left">
              <h3 className="text-lg font-medium text-gray-900">Sàng lọc công ty</h3>
              <p className="text-sm text-gray-500">Tìm kiếm và lọc theo tiêu chí</p>
            </div>
          </div>
          <ArrowRight className="h-5 w-5 text-gray-400" />
        </button>
        
        <button
          onClick={() => navigate('/compare')}
          className="flex items-center justify-between p-6 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
        >
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4 text-left">
              <h3 className="text-lg font-medium text-gray-900">So sánh công ty</h3>
              <p className="text-sm text-gray-500">So sánh 2-5 công ty</p>
            </div>
          </div>
          <ArrowRight className="h-5 w-5 text-gray-400" />
        </button>
      </div>
    </div>
  );
};

export default Home;
