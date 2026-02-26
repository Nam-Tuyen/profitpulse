import { useState, useEffect } from 'react';
import { Search, GitCompare, X, TrendingUp, AlertCircle } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import apiService from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import ChartCaption from '../components/ChartCaption';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const Compare = () => {
  const [allFirms, setAllFirms] = useState([]);
  const [selectedFirms, setSelectedFirms] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [availableYears, setAvailableYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState(null);
  const [comparisonData, setComparisonData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  
  useEffect(() => {
    loadMeta();
  }, []);
  
  const loadMeta = async () => {
    try {
      const metaData = await apiService.getMeta();
      setAllFirms(metaData.firms || []);
      setAvailableYears(metaData.years || []);
      if (metaData.years && metaData.years.length > 0) {
        setSelectedYear(metaData.years[metaData.years.length - 1]);
      }
    } catch (error) {
      console.error('Error loading meta:', error);
    }
  };
  
  const filteredFirms = allFirms.filter(firm => 
    firm.toLowerCase().includes(searchQuery.toLowerCase()) &&
    !selectedFirms.includes(firm)
  ).slice(0, 10);
  
  const handleAddFirm = (firm) => {
    if (selectedFirms.length < 5) {
      setSelectedFirms([...selectedFirms, firm]);
      setSearchQuery('');
      setShowDropdown(false);
    }
  };
  
  const handleRemoveFirm = (firm) => {
    setSelectedFirms(selectedFirms.filter(f => f !== firm));
  };
  
  const handleCompare = async () => {
    if (selectedFirms.length < 2 || !selectedYear) {
      return;
    }
    
    try {
      setLoading(true);
      const data = await apiService.compare(selectedFirms, selectedYear);
      
      // Process data for charts
      const processedData = await processComparisonData(data.comparison);
      setComparisonData(processedData);
      setLoading(false);
    } catch (error) {
      console.error('Error comparing:', error);
      setLoading(false);
    }
  };
  
  const processComparisonData = async (comparison) => {
    // Get historical data for each firm
    const timeseriesData = {};
    
    for (const firm of selectedFirms) {
      try {
        const firmData = await apiService.getCompany(firm);
        timeseriesData[firm] = firmData.timeseries || [];
      } catch (error) {
        console.error(`Error loading ${firm}:`, error);
        timeseriesData[firm] = [];
      }
    }
    
    return {
      comparison,
      timeseries: timeseriesData
    };
  };
  
  const prepareTimeSeriesChart = () => {
    if (!comparisonData || !comparisonData.timeseries) return [];
    
    // Combine all years
    const allYears = new Set();
    Object.values(comparisonData.timeseries).forEach(series => {
      series.forEach(point => allYears.add(point.year));
    });
    
    const sortedYears = Array.from(allYears).sort();
    
    return sortedYears.map(year => {
      const dataPoint = { year };
      selectedFirms.forEach(firm => {
        const series = comparisonData.timeseries[firm] || [];
        const point = series.find(p => p.year === year);
        dataPoint[firm] = point?.profitscore || null;
      });
      return dataPoint;
    });
  };
  
  const prepareChanceChart = () => {
    if (!comparisonData || !comparisonData.comparison) return [];
    
    return comparisonData.comparison.map(item => ({
      firm: item.FIRM_ID,
      score: item.score || 0
    }));
  };
  
  const getRiskBadge = (label) => {
    const risk = label === 1 ? 'High' : 'Low';
    const colors = risk === 'High' 
      ? 'bg-gradient-to-r from-red-500 to-red-600 text-white'
      : 'bg-gradient-to-r from-green-500 to-green-600 text-white';
    return <span className={`px-3 py-1 rounded-full text-xs font-semibold ${colors}`}>{risk}</span>;
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-cyan-600 via-blue-600 to-indigo-600 rounded-2xl shadow-xl p-6 sm:p-8">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
            So sánh công ty
          </h1>
          <p className="text-cyan-100 text-sm sm:text-base">
            So sánh 2–5 mã để ra quyết định nhanh về Risk và ProfitScore
          </p>
        </div>
      </div>
      
      {/* Selection Panel */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100 p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Firm Selector */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Chọn công ty (tối đa 5)
            </label>
            <div className="relative">
              <div className="flex items-center gap-2 border-2 border-gray-200 rounded-xl px-4 py-2 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
                <Search className="h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowDropdown(true);
                  }}
                  onFocus={() => setShowDropdown(true)}
                  placeholder="Tìm mã công ty..."
                  className="flex-1 outline-none text-gray-900"
                  disabled={selectedFirms.length >= 5}
                />
              </div>
              
              {/* Dropdown */}
              {showDropdown && searchQuery && filteredFirms.length > 0 && (
                <div className="absolute z-10 w-full mt-2 bg-white rounded-xl shadow-lg border border-gray-200 max-h-60 overflow-y-auto">
                  {filteredFirms.map((firm) => (
                    <button
                      key={firm}
                      onClick={() => handleAddFirm(firm)}
                      className="w-full text-left px-4 py-2 hover:bg-blue-50 transition"
                    >
                      {firm}
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            {/* Selected Chips */}
            <div className="flex flex-wrap gap-2 mt-4">
              {selectedFirms.map((firm, idx) => (
                <div
                  key={firm}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium shadow-sm"
                  style={{ backgroundColor: COLORS[idx] + '20', color: COLORS[idx] }}
                >
                  <span>{firm}</span>
                  <button
                    onClick={() => handleRemoveFirm(firm)}
                    className="hover:opacity-70 transition"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
          
          {/* Year Selector */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Năm so sánh (t)
            </label>
            <select
              value={selectedYear || ''}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="block w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            >
              {availableYears.map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
            
            <button
              onClick={handleCompare}
              disabled={selectedFirms.length < 2 || loading}
              className="w-full mt-4 inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <GitCompare className="h-5 w-5" />
              So sánh ngay
            </button>
            
            {selectedFirms.length < 2 && (
              <p className="text-sm text-gray-500 mt-2">
                Cần chọn ít nhất 2 công ty để so sánh
              </p>
            )}
          </div>
        </div>
      </div>
      
      {/* Loading */}
      {loading && <LoadingSpinner message="Đang tải dữ liệu so sánh..." />}
      
      {/* Comparison Results */}
      {!loading && comparisonData && (
        <div className="space-y-6">
          {/* Comparison Table */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-indigo-500 px-6 py-4">
              <h3 className="text-lg font-bold text-white">
                Bảng so sánh - Năm {selectedYear}
              </h3>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Mã</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Risk</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">ProfitScore</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">ROA</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">ROE</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">NPM</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {comparisonData.comparison.map((row, idx) => (
                    <tr key={row.FIRM_ID} className="hover:bg-blue-50 transition">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-bold" style={{ color: COLORS[idx] }}>
                          {row.FIRM_ID}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getRiskBadge(row.label)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm font-semibold ${row.score < 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {row.score?.toFixed(4) || '—'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {row.X1_ROA?.toFixed(4) || '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {row.X2_ROE?.toFixed(4) || '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {row.X5_NPM?.toFixed(4) || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          {/* ProfitScore Overlay Chart */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100 p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <TrendingUp className="h-5 w-5 mr-2 text-blue-600" />
              ProfitScore theo thời gian
            </h3>
            
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={prepareTimeSeriesChart()}>
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
                {selectedFirms.map((firm, idx) => (
                  <Line
                    key={firm}
                    type="monotone"
                    dataKey={firm}
                    stroke={COLORS[idx]}
                    strokeWidth={3}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
            
            <ChartCaption
              title="So sánh xu hướng lợi nhuận"
              subtitle="Biểu đồ overlay của ProfitScore qua các năm"
              caption="Ý nghĩa: So sánh xu hướng lợi nhuận tổng hợp giữa các công ty. Đường càng ổn định và dương thì công ty càng đáng tin cậy."
              purpose="Mục đích: Chọn công ty có ProfitScore ổn định hơn hoặc phục hồi tốt hơn so với đối thủ."
            />
          </div>
          
          {/* Current Score Comparison */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100 p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <GitCompare className="h-5 w-5 mr-2 text-purple-600" />
              So sánh ProfitScore năm {selectedYear}
            </h3>
            
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={prepareChanceChart()}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="firm" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: 'none',
                    borderRadius: '12px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Bar dataKey="score" radius={[8, 8, 0, 0]}>
                  {prepareChanceChart().map((entry, index) => (
                    <Bar key={`bar-${index}`} dataKey="score" fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            
            <ChartCaption
              title="So sánh rủi ro hiện tại"
              subtitle="ProfitScore của từng công ty trong năm được chọn"
              caption="Ý nghĩa: So sánh điểm lợi nhuận tổng hợp giữa các công ty trong cùng năm t. Điểm dương cao hơn thường tốt hơn."
              purpose="Mục đích: Ưu tiên công ty có ProfitScore cao hơn và ổn định trong nhóm so sánh."
            />
          </div>
        </div>
      )}
      
      {/* Empty State */}
      {!loading && !comparisonData && (
        <div className="text-center py-16">
          <GitCompare className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">
            Chọn ít nhất 2 công ty và nhấn "So sánh ngay" để xem kết quả
          </p>
        </div>
      )}
    </div>
  );
};

export default Compare;
