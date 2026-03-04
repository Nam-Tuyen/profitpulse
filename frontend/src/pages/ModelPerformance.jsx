import { useState, useEffect, useMemo } from 'react';
import { Activity, TrendingUp, BarChart3, AlertTriangle } from 'lucide-react';
import {
  LineChart, Line, ComposedChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RTooltip, Legend, ResponsiveContainer,
} from 'recharts';
import apiService from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import PageIntro from '../components/PageIntro';
import ChartCaption from '../components/ChartCaption';
import StatsCard from '../components/StatsCard';
import { safeNum } from '../utils/helpers';

const ModelPerformance = () => {
  const [meta, setMeta] = useState(null);
  const [summaries, setSummaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const metaRes = await apiService.getMeta();
        setMeta(metaRes);
        
        const years = metaRes.years || [];
        if (years.length === 0) {
          setError('Không có dữ liệu năm.');
          setLoading(false);
          return;
        }
        
        // Fetch summary for each year
        const summaryPromises = years.map(year => 
          apiService.getSummary(year)
            .then(s => ({
              year,
              avg_profit_score: s._normalised?.avg_profit_score ?? null,
              max_profit_score: s._normalised?.max_profit_score ?? null,
              min_profit_score: s._normalised?.min_profit_score ?? null,
              high_risk_count: s._normalised?.high_risk_count ?? 0,
              low_risk_count: s._normalised?.low_risk_count ?? 0,
              total_firms: s._normalised?.total_firms ?? 0,
            }))
            .catch(() => null)
        );
        
        const results = await Promise.all(summaryPromises);
        const validResults = results.filter(r => r !== null).sort((a, b) => a.year - b.year);
        setSummaries(validResults);
      } catch (err) {
        console.error(err);
        setError('Không thể tải dữ liệu.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const chartData = useMemo(() => {
    return summaries.map(s => ({
      year: s.year,
      avgScore: s.avg_profit_score,
      maxScore: s.max_profit_score,
      minScore: s.min_profit_score,
      highRiskShare: s.total_firms > 0 ? (s.high_risk_count / s.total_firms) * 100 : 0,
      highRiskCount: s.high_risk_count,
      totalFirms: s.total_firms,
    }));
  }, [summaries]);

  const currentYearData = summaries.length > 0
    ? (summaries.find(s => s.year === 2024) || summaries[summaries.length - 1])
    : null;

  const chartTooltipStyle = { 
    background: 'rgba(26,32,53,0.95)', 
    border: '1px solid rgba(255,255,255,0.08)', 
    borderRadius: 12 
  };

  if (loading) return <LoadingSpinner message="Đang tải dữ liệu theo năm..." />;
  
  if (error) {
    return (
      <div className="text-center py-20">
        <AlertTriangle className="h-12 w-12 text-rose-400 mx-auto mb-4" />
        <p className="text-slate-300">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageIntro
        text="Trang Stability theo năm giúp bạn theo dõi mức điểm lợi nhuận trung bình và tỷ lệ rủi ro cao của toàn thị trường thay đổi như thế nào qua từng năm, từ đó đánh giá được mức độ ổn định hoặc biến động của thị trường."
      />

      {/* KPI Cards - Current Year */}
      {currentYearData && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard 
            title="Năm hiện tại"
            value={currentYearData.year}
            icon={Activity}
            color="purple"
          />
          <StatsCard 
            title="Điểm trung bình"
            value={currentYearData.avg_profit_score != null ? safeNum(currentYearData.avg_profit_score, 2) : 'N/A'}
            icon={TrendingUp}
            color="cyan"
          />
          <StatsCard 
            title="Tỷ lệ doanh nghiệp có rủi ro cao"
            value={`${currentYearData.total_firms > 0 ? ((currentYearData.high_risk_count / currentYearData.total_firms) * 100).toFixed(1) : '0'}%`}
            icon={AlertTriangle}
            color="red"
          />
          <StatsCard 
            title="Khoảng thời gian"
            value={summaries.length}
            icon={BarChart3}
            color="green"
          />
        </div>
      )}

      {/* Average Profit Score by Year */}
      {chartData.length > 0 && (
        <section className="card card-hover p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-display font-bold text-white mb-1">
            Xu hướng Profit Score qua từng năm
          </h3>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData}>
                <defs>
                  <linearGradient id="gradAvgScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366F1" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#6366F1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="year" tick={{ fill: '#94A3B8', fontSize: 12 }} />
                <YAxis tick={{ fill: '#94A3B8', fontSize: 12 }} />
                <RTooltip 
                  contentStyle={chartTooltipStyle}
                  formatter={(val, name) => {
                    if (name === 'avgScore') return [safeNum(val, 2), 'Avg Score'];
                    if (name === 'maxScore') return [safeNum(val, 2), 'Max'];
                    if (name === 'minScore') return [safeNum(val, 2), 'Min'];
                    return [val, name];
                  }}
                  labelFormatter={(l) => `Năm ${l}`}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="maxScore" 
                  name="Max Score" 
                  stroke="#10B981" 
                  strokeWidth={1}
                  strokeDasharray="5 5"
                  dot={{ r: 3 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="avgScore" 
                  name="Avg Score" 
                  stroke="#6366F1" 
                  strokeWidth={3}
                  dot={{ r: 5, fill: '#6366F1' }}
                  fill="url(#gradAvgScore)"
                />
                <Line 
                  type="monotone" 
                  dataKey="minScore" 
                  name="Min Score" 
                  stroke="#F43F5E" 
                  strokeWidth={1}
                  strokeDasharray="5 5"
                  dot={{ r: 3 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <ChartCaption caption="Biểu đồ cho bạn thấy Profit Score ở ba mốc trung bình, lớn nhất và nhỏ nhất qua từng năm để bạn có được cái nhìn tổng quan về biến động của thị trường." />
        </section>
      )}

      {/* High Risk Share by Year */}
      {chartData.length > 0 && (
        <section className="card card-hover p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-display font-bold text-white mb-1">
            Tỷ lệ doanh nghiệp có mức rủi ro cao qua từng năm
          </h3>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData}>
                <defs>
                  <linearGradient id="gradRiskShare" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#F43F5E" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#F43F5E" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="year" tick={{ fill: '#94A3B8', fontSize: 12 }} />
                <YAxis 
                  tick={{ fill: '#94A3B8', fontSize: 12 }}
                  label={{ value: '%', position: 'insideLeft', style: { fill: '#94A3B8' } }}
                />
                <RTooltip 
                  contentStyle={chartTooltipStyle}
                  formatter={(val, name, props) => {
                    if (name === 'highRiskShare') {
                      return [
                        `${safeNum(val, 1)}% (${props.payload.highRiskCount}/${props.payload.totalFirms})`,
                        'High Risk Share'
                      ];
                    }
                    return [val, name];
                  }}
                  labelFormatter={(l) => `Năm ${l}`}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="highRiskShare" 
                  name="High Risk %" 
                  stroke="#F43F5E" 
                  strokeWidth={3}
                  dot={{ r: 5, fill: '#F43F5E' }}
                  fill="url(#gradRiskShare)"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <ChartCaption caption="Biểu đồ cho bạn thấy tỷ trọng các doanh nghiệp có mức rủi ro cao qua từng năm để giúp bạn đánh giá được mức độ ổn định của thị trường." />
        </section>
      )}

      {/* Summary Table */}
      {summaries.length > 0 && (
        <section className="card overflow-hidden">
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-white/6">
            <h3 className="text-base sm:text-lg font-display font-bold text-white">
              Bảng tổng hợp kết quả thống kê theo năm
            </h3>
          </div>
          <div className="overflow-x-auto max-h-[520px] overflow-y-auto">
            <table className="w-full text-xs sm:text-sm min-w-[640px]">
              <thead className="bg-white/3 text-muted sticky top-0 z-10" style={{ backgroundColor: '#131929' }}>
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Năm</th>
                  <th className="px-4 py-3 text-right font-medium">Tổng DN</th>
                  <th className="px-4 py-3 text-right font-medium">Avg Score</th>
                  <th className="px-4 py-3 text-right font-medium">Min Score</th>
                  <th className="px-4 py-3 text-right font-medium">Max Score</th>
                  <th className="px-4 py-3 text-right font-medium">Risk Cao</th>
                  <th className="px-4 py-3 text-right font-medium">Risk Thấp</th>
                  <th className="px-4 py-3 text-right font-medium">Risk %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/6">
                {summaries.map((s, idx) => (
                  <tr key={idx} className="hover:bg-white/3 transition">
                    <td className="px-4 py-3 font-semibold text-white">{s.year}</td>
                    <td className="px-4 py-3 text-right text-slate-300">{s.total_firms}</td>
                    <td className="px-4 py-3 text-right font-mono text-white">
                      {s.avg_profit_score != null ? safeNum(s.avg_profit_score, 2) : 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-rose-400">
                      {s.min_profit_score != null ? safeNum(s.min_profit_score, 2) : 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-emerald-400">
                      {s.max_profit_score != null ? safeNum(s.max_profit_score, 2) : 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-right text-rose-400">{s.high_risk_count}</td>
                    <td className="px-4 py-3 text-right text-emerald-400">{s.low_risk_count}</td>
                    <td className="px-4 py-3 text-right font-semibold text-amber-400">
                      {s.total_firms > 0 ? `${((s.high_risk_count / s.total_firms) * 100).toFixed(1)}%` : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}


    </div>
  );
};

export default ModelPerformance;
