import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  TrendingUp, AlertTriangle, Search, ArrowRight,
  Building2, BarChart3, Eye,
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
const PURPLE = '#7C3AED';
const CYAN = '#06B6D4';

const Home = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [meta, setMeta] = useState(null);
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [metaRes, summaryRes] = await Promise.all([
          apiService.getMeta(),
          apiService.getSummary(),
        ]);
        setMeta(metaRes);
        setSummary(summaryRes);
      } catch (err) {
        console.error(err);
        setError('Không thể tải dữ liệu. Vui lòng thử lại sau.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

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
  const currentYear = summary?.year;
  const firms = meta?.companies || meta?.firms || [];

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
    <div className="space-y-5 sm:space-y-6 md:space-y-8">
      <ModelContextBar selectedYear={currentYear} />

      {/* ===== Hero ===== */}
      <section className="relative overflow-hidden card p-5 sm:p-8 md:p-12" style={{ background: 'linear-gradient(135deg, #1A2035 0%, #252060 60%, #3B1F8E 100%)' }}>
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

      <PageIntro
        text="Trang chủ cho bạn nhìn nhanh bức tranh lợi nhuận của thị trường theo năm gần nhất và giúp bạn đi thẳng đến mã cần xem hoặc bộ lọc."
        note="Nội dung trên ProfitPulse chỉ phục vụ phân tích và không phải khuyến nghị mua bán."
      />

      {/* ===== KPI Cards ===== */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 anim-stagger">
        <StatsCard title="Tổng DN" value={kpi.total_firms ?? '—'} subtitle={`Năm ${currentYear || '—'}`} icon={Building2} color="purple" />
        <StatsCard title="Điểm TB" value={kpi.avg_profit_score != null ? safeNum(kpi.avg_profit_score, 2) : '—'} subtitle="Avg Score" icon={BarChart3} color="cyan" />
        <StatsCard title="Risk Cao" value={kpi.high_risk_count ?? '—'} subtitle="label_t = 1" icon={AlertTriangle} color="red" />
        <StatsCard title="Risk Thấp" value={kpi.low_risk_count ?? '—'} subtitle="label_t = 0" icon={TrendingUp} color="green" />
      </section>

      {/* ===== Charts grid (2/3 + 1/3) ===== */}
      {(pieData || scoreDistData) && (
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Large area chart */}
          {scoreDistData && (
            <div className="lg:col-span-2 card card-hover p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-display font-bold text-white mb-1">Phân phối điểm</h3>
              <p className="text-xs sm:text-sm text-muted mb-3 sm:mb-4">Doanh nghiệp tập trung nhiều ở vùng điểm nào.</p>
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
                  <XAxis dataKey="range" tick={{ fill: '#94A3B8', fontSize: 12 }} />
                  <YAxis tick={{ fill: '#94A3B8', fontSize: 12 }} />
                  <RTooltip contentStyle={{ background: 'rgba(26,32,53,0.95)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12 }} />
                  <Area type="monotone" dataKey="count" stroke={PURPLE} fill="url(#gradPurple)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
              </div>
              <ChartCaption caption="Biểu đồ cho bạn thấy doanh nghiệp tập trung nhiều ở vùng điểm nào." />
            </div>
          )}

          {/* Pie chart (1/3) */}
          {pieData && (
            <div className="card card-hover p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-display font-bold text-white mb-1">Phân bổ rủi ro</h3>
              <p className="text-xs sm:text-sm text-muted mb-3 sm:mb-4">Thị trường nghiêng về rủi ro thấp hay cao.</p>
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
              <ChartCaption caption="Biểu đồ cho bạn thấy năm này thị trường nghiêng về rủi ro thấp hay rủi ro cao." />
            </div>
          )}
        </section>
      )}

      {/* ===== Top Companies Table ===== */}
      {topCompanies.length > 0 && (
        <section className="card overflow-hidden">
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-white/6 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-base sm:text-lg font-display font-bold text-white">Top doanh nghiệp</h3>
              <p className="text-xs sm:text-sm text-muted">Chọn nhanh các mã nổi bật để theo dõi hoặc so sánh.</p>
            </div>
            <Link to="/screener" className="text-sm text-primary-400 hover:text-primary-300 flex items-center gap-1 transition">
              Xem tất cả <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs sm:text-sm min-w-[640px]">
              <thead className="bg-white/3 text-muted">
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
                {topCompanies.slice(0, 15).map((c, idx) => {
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
