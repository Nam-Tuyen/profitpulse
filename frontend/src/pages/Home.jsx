import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  TrendingUp, AlertTriangle, Search, ArrowRight,
  Building2, BarChart3, Eye, Calendar, Info, Shield,
} from 'lucide-react';
import {
  BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area,
  XAxis, YAxis, CartesianGrid,
  Tooltip as RTooltip, Legend, ResponsiveContainer,
} from 'recharts';
import apiService from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import ModelContextBar from '../components/ModelContextBar';
import PageIntro from '../components/PageIntro';
import ChartCaption from '../components/ChartCaption';
import QuickSearch from '../components/QuickSearch';
import StatsCard from '../components/StatsCard';
import Tooltip, { TOOLTIPS } from '../components/Tooltip';
import { safeNum, riskBadge, tickerFromFirmId } from '../utils/helpers';

const PIE_COLORS = ['#10B981', '#F43F5E'];
const PURPLE = '#6366F1';
const CYAN = '#06B6D4';

const Home = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [meta, setMeta] = useState(null);
  const [summary, setSummary] = useState(null);
  const [selectedYear, setSelectedYear] = useState(null);
  const [showYearPicker, setShowYearPicker] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const metaRes = await apiService.getMeta();
        setMeta(metaRes);
        
        // Set default year to 2024
        const defaultYear = 2024;
        const latestYear = metaRes?.years?.length ? metaRes.years[metaRes.years.length - 1] : defaultYear;
        if (!selectedYear) setSelectedYear(defaultYear);
        
        const summaryRes = await apiService.getSummary(selectedYear || defaultYear);
        setSummary(summaryRes);
      } catch (err) {
        console.error(err);
        setError('Không thể tải dữ liệu. Vui lòng thử lại sau.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [selectedYear]);

  if (loading) return <LoadingSpinner message="Đang tải tổng quan..." />;
  if (error) {
    return (
      <div className="text-center py-20">
        <AlertTriangle className="h-12 w-12 text-rose-400 mx-auto mb-4" />
        <p className="text-slate-300">{error}</p>
        <button onClick={() => window.location.reload()} className="mt-4 btn-primary">Tải lại</button>
      </div>
    );
  }

  const kpi = summary?._normalised || {};
  const chartData = summary?.chart_data;
  const topCompanies = summary?.top_companies || [];
  const currentYear = selectedYear || summary?.year || 2024;
  const firms = meta?.companies || meta?.firms || [];
  const availableYears = meta?.years || [];

  const pieData = chartData?.risk_distribution
    ? [
        { name: 'Risk Thấp', value: chartData.risk_distribution.Low ?? 0 },
        { name: 'Risk Cao', value: chartData.risk_distribution.High ?? 0 },
      ]
    : kpi.low_risk_count || kpi.high_risk_count
    ? [
        { name: 'Risk Thấp', value: kpi.low_risk_count },
        { name: 'Risk Cao', value: kpi.high_risk_count },
      ]
    : null;

  const scoreDistData = chartData?.score_distribution || null;

  return (
    <div className="max-w-7xl mx-auto space-y-5 sm:space-y-6 md:space-y-8">
      {/* ===== Hero ===== */}
      <section className="relative overflow-hidden card p-5 sm:p-8 md:p-12" style={{ background: 'linear-gradient(135deg, #131929 0%, #1E284E 60%, #3730A3 100%)' }}>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-48 sm:w-96 h-48 sm:h-96 bg-primary-500 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-32 sm:w-64 h-32 sm:h-64 bg-accent-500 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl" />
        </div>
        <div className="relative z-10 max-w-3xl">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-display font-extrabold text-white mb-2 sm:mb-3 tracking-tight">
            ProfitPulse
          </h1>
          <p className="text-slate-300 text-sm sm:text-base md:text-lg mb-4 sm:mb-6 font-body leading-relaxed">
            Phân tích và dự báo lợi nhuận doanh nghiệp Việt Nam dựa trên mô hình PCA &amp; Machine Learning.
          </p>
          <div className="mb-4 sm:mb-6">
            <QuickSearch firms={firms} />
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <Link to="/screener" className="btn-primary w-full sm:w-auto">
              <Search className="h-4 w-4" /> Lọc doanh nghiệp
            </Link>
            <Link to="/about" className="btn-ghost w-full sm:w-auto">
              Cách hoạt động <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ===== Page Intro ===== */}
      <div className="flex items-start gap-2 sm:gap-2.5 bg-primary-600/8 border border-primary-500/15 rounded-xl px-3 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm">
        <Info className="h-5 w-5 text-primary-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-slate-300 leading-relaxed mb-2">
            Trang chủ giúp bạn quan sát được tổng quan lợi nhuận của thị trường theo năm đồng thời cho phép bạn tìm hoặc dùng bộ lọc để chọn lọc nhóm cổ phiếu hoặc doanh nghiệp cần phân tích. Dữ liệu được thu thập từ năm 1999 đến 2025, mô hình kiểm định trong giai đoạn 2021 đến 2024
          </p>
          <div className="flex items-start gap-1.5 text-amber-400">
            <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <p className="text-xs italic font-semibold">
              Lưu ý: Nội dung trên ProfitPulse chỉ phục vụ phân tích, cung cấp thêm góc nhìn và không phải khuyến nghị mua bán.
            </p>
          </div>
        </div>
      </div>

      {/* ===== Year Selector ===== */}
      <div className="card p-4 sm:p-5 bg-gradient-to-r from-primary-600/10 to-accent-500/10 border-primary-500/20">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs sm:text-sm text-muted mb-1">Năm quan sát hiện tại</p>
            <p className="text-2xl sm:text-3xl font-display font-extrabold text-white">{currentYear}</p>
          </div>
          <div className="relative">
            <button
              onClick={() => setShowYearPicker(!showYearPicker)}
              className="btn-primary flex items-center gap-2 px-4 py-2"
            >
              <Calendar className="h-4 w-4" />
              <span>Chọn năm</span>
            </button>
            {showYearPicker && (
              <div className="absolute right-0 top-full mt-2 bg-surface-card border border-white/10 rounded-xl shadow-lg z-50 p-2 min-w-[200px] max-h-[300px] overflow-y-auto">
                {availableYears.slice().reverse().map((year) => (
                  <button
                    key={year}
                    onClick={() => {
                      setSelectedYear(year);
                      setShowYearPicker(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg transition ${
                      year === currentYear
                        ? 'bg-primary-600/20 text-primary-400 font-semibold'
                        : 'text-slate-300 hover:bg-white/5'
                    }`}
                  >
                    {year}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ===== KPI Cards ===== */}
      <section className="grid grid-cols-2 lg:grid-cols-6 gap-3 sm:gap-4 anim-stagger">
        <StatsCard 
          title="Tổng số lượng doanh nghiệp" 
          value={kpi.total_firms ?? '—'} 
          subtitle={`Trong năm ${currentYear || '—'}`} 
          icon={Building2} 
          color="purple" 
        />
        <StatsCard 
          title="Điểm trung bình" 
          value={kpi.avg_profit_score != null ? safeNum(kpi.avg_profit_score, 2) : '—'} 
          subtitle="Số điểm trung bình toàn thị trường" 
          icon={BarChart3} 
          color="cyan" 
        />
        <StatsCard 
          title="Điểm thấp nhất" 
          value={kpi.min_profit_score != null ? safeNum(kpi.min_profit_score, 2) : '—'} 
          subtitle="Số điểm thấp nhất" 
          icon={TrendingUp} 
          color="gray" 
        />
        <StatsCard 
          title="Điểm cao nhất" 
          value={kpi.max_profit_score != null ? safeNum(kpi.max_profit_score, 2) : '—'} 
          subtitle="Số điểm cao nhất" 
          icon={TrendingUp} 
          color="green" 
        />
        <StatsCard 
          title="Số lượng công ty có rủi ro cao" 
          value={kpi.high_risk_count ?? '—'} 
          subtitle="Khi tỷ lệ label_t = 1 vì P_t > 0" 
          icon={AlertTriangle} 
          color="red" 
        />
        <StatsCard 
          title="Tỷ lệ công ty có rủi ro cao" 
          value={
            kpi.high_risk_count != null && kpi.total_firms != null && kpi.total_firms > 0
              ? `${((kpi.high_risk_count / kpi.total_firms) * 100).toFixed(1)}%`
              : '—'
          } 
          subtitle={`Tỷ lệ công ty có rủi ro cao trong năm ${currentYear || '—'}`} 
          icon={AlertTriangle} 
          color="red" 
        />
      </section>

      {/* ===== Charts grid (2/3 + 1/3) ===== */}
      {(pieData || scoreDistData) && (
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Large area chart */}
          {scoreDistData && (
            <div className="lg:col-span-2 card card-hover p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-display font-bold text-white mb-4">Biểu đồ phân phối</h3>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={scoreDistData}>
                  <defs>
                    <linearGradient id="gradPurple" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={PURPLE} stopOpacity={0.4} />
                      <stop offset="100%" stopColor={PURPLE} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="range" tick={{ fill: '#94A3B8', fontSize: 14 }} />
                  <YAxis tick={{ fill: '#94A3B8', fontSize: 14 }} />
                  <RTooltip contentStyle={{ background: 'rgba(26,32,53,0.95)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12 }} />
                  <Area type="monotone" dataKey="count" stroke={PURPLE} fill="url(#gradPurple)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
              </div>
              <ChartCaption caption="Biểu đồ cho thấy các doanh nghiệp đang phân bổ ở các vùng điểm như thế nào." />
            </div>
          )}

          {/* Pie chart (1/3) */}
          {pieData && (
            <div className="card card-hover p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-display font-bold text-white mb-4">Biểu đồ phân bổ rủi ro trong năm</h3>
              <div style={{ height: 220 }} className="sm:h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {pieData.map((_, i) => (<Cell key={i} fill={PIE_COLORS[i]} />))}
                  </Pie>
                  <RTooltip contentStyle={{ background: 'rgba(26,32,53,0.95)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              </div>
              <ChartCaption caption="Biểu đồ cho thấy mức độ phân bổ rủi ro thấp và cao giữa các doanh nghiệp." />
            </div>
          )}
        </section>
      )}

      {/* ===== Top Companies Table ===== */}
      {topCompanies.length > 0 && (
        <section className="card overflow-hidden">
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-white/6 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-base sm:text-lg font-display font-bold text-white">Top 10 doanh nghiệp đáng lưu ý trong năm {currentYear}</h3>
            </div>
            <Link to="/screener" className="text-sm text-primary-400 hover:text-primary-300 flex items-center gap-1 transition">
              Xem tất cả <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
            <table className="w-full text-xs sm:text-sm min-w-[640px]">
              <thead className="bg-white/3 text-muted sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">#</th>
                  <th className="px-4 py-3 text-left font-medium">Mã</th>
                  <th className="px-4 py-3 text-right font-medium"><Tooltip text={TOOLTIPS.profit_score}>Score</Tooltip></th>
                  <th className="px-4 py-3 text-right font-medium"><Tooltip text={TOOLTIPS.percentile}>Percentile</Tooltip></th>
                  <th className="px-4 py-3 text-center font-medium"><Tooltip text={TOOLTIPS.label_risk}>Nhãn</Tooltip></th>
                  <th className="px-4 py-3 text-center font-medium">Năm</th>
                  <th className="px-4 py-3 text-center font-medium"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/6">
                {topCompanies.slice(0, 10).map((c, idx) => {
                  const badge = riskBadge(c.label_t);
                  const ticker = tickerFromFirmId(c.firm_id);
                  return (
                    <tr key={idx} className="hover:bg-white/3 transition">
                      <td className="px-4 py-3 text-muted">{idx + 1}</td>
                      <td className="px-4 py-3 font-semibold text-white">{c.firm_id}</td>
                      <td className="px-4 py-3 text-right font-mono text-white">{safeNum(c.profit_score, 2)}</td>
                      <td className="px-4 py-3 text-right text-slate-300">{c.percentile_year ?? 'N/A'}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${badge.className}`}>{badge.text}</span>
                      </td>
                      <td className="px-4 py-3 text-center text-muted">{c.year || currentYear}</td>
                      <td className="px-4 py-3 text-center">
                        <button onClick={() => navigate(`/company/${ticker}`)} className="text-primary-400 hover:text-primary-300 transition" title="Xem chi tiết">
                          <Eye className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
};

export default Home;
