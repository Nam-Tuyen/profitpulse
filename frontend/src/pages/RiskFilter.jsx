import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Eye, Calendar, Filter } from 'lucide-react';
import {
  PieChart, Pie, Cell, Tooltip as RTooltip, Legend, ResponsiveContainer,
} from 'recharts';
import apiService from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import PageIntro from '../components/PageIntro';
import ChartCaption from '../components/ChartCaption';
import { safeNum, riskBadge, tickerFromFirmId } from '../utils/helpers';

const PIE_COLORS = ['#F43F5E', '#10B981'];
const TOP_OPTIONS = [
  { key: '10', label: 'Top 10' },
  { key: '20', label: 'Top 20' },
  { key: '50', label: 'Top 50' },
  { key: 'all', label: 'Tất cả' },
];
const RISK_OPTIONS = [
  { key: 'high', label: 'Rủi ro cao', color: 'rose' },
  { key: 'low', label: 'Rủi ro thấp', color: 'emerald' },
];

const CustomPieTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl px-3 py-2 text-xs" style={{ background: 'rgba(17,24,39,0.95)', border: '1px solid rgba(255,255,255,0.08)' }}>
      <p className="font-semibold text-white">{payload[0].name}</p>
      <p style={{ color: payload[0].payload.fill }}>{payload[0].value} doanh nghiệp ({payload[0].payload.pct}%)</p>
    </div>
  );
};

const RiskFilter = () => {
  const navigate = useNavigate();
  const [meta, setMeta] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const years = meta?.years || [];
  const latestYear = years.length ? Math.max(...years) : null;
  const [selectedYear, setSelectedYear] = useState(null);
  const [riskType, setRiskType] = useState('high');
  const [topLimit, setTopLimit] = useState('10');

  // Load meta on mount
  useEffect(() => {
    apiService.getMeta().then((m) => {
      setMeta(m);
      const maxYear = m?.years ? Math.max(...m.years) : null;
      if (maxYear) setSelectedYear(maxYear);
    }).catch(() => {});
  }, []);

  // Load summary when year changes
  useEffect(() => {
    if (!selectedYear) return;
    setLoading(true);
    setError(null);
    apiService.getSummary(selectedYear)
      .then((d) => setSummary(d))
      .catch(() => setError('Không thể tải dữ liệu. Vui lòng thử lại.'))
      .finally(() => setLoading(false));
  }, [selectedYear]);

  const allCompanies = summary?.top_companies || [];

  // Filter and limit companies
  const filtered = useMemo(() => {
    const withRisk = allCompanies.filter((c) => {
      const label = c.label_t ?? c.label;
      const isHigh = label === 1 || label === '1';
      return riskType === 'high' ? isHigh : !isHigh;
    });
    if (topLimit === 'all') return withRisk;
    return withRisk.slice(0, parseInt(topLimit, 10));
  }, [allCompanies, riskType, topLimit]);

  // Pie chart data
  const pieData = useMemo(() => {
    const highCount = summary?._normalised?.high_risk_count ?? (summary?.high_risk_count ?? 0);
    const lowCount = summary?._normalised?.low_risk_count ?? (summary?.low_risk_count ?? 0);
    const total = highCount + lowCount || 1;
    return [
      { name: 'Rủi ro cao', value: highCount, fill: PIE_COLORS[0], pct: ((highCount / total) * 100).toFixed(1) },
      { name: 'Rủi ro thấp', value: lowCount, fill: PIE_COLORS[1], pct: ((lowCount / total) * 100).toFixed(1) },
    ];
  }, [summary]);

  const displayYears = [...years].sort((a, b) => b - a).slice(0, 10);

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageIntro text="Lọc doanh nghiệp theo mức độ rủi ro và quan sát tỷ lệ phân bổ giữa hai nhóm trong từng năm." />

      {/* ── Filter bar ── */}
      <section className="card p-4 sm:p-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-5 w-5 text-primary-400" />
          <h2 className="text-base sm:text-lg font-display font-bold text-white">Bộ lọc</h2>
        </div>
        <div className="flex flex-wrap gap-4 items-end">
          {/* Year selector */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted uppercase tracking-wide flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" /> Năm
            </label>
            <div className="flex flex-wrap gap-1.5">
              {displayYears.map((y) => (
                <button
                  key={y}
                  onClick={() => setSelectedYear(y)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition ${
                    selectedYear === y
                      ? 'bg-primary-600/30 text-primary-400 ring-1 ring-primary-500/40'
                      : 'bg-white/5 text-muted hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {y}
                </button>
              ))}
            </div>
          </div>

          {/* Risk type */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted uppercase tracking-wide flex items-center gap-1">
              <Shield className="h-3.5 w-3.5" /> Mức độ rủi ro
            </label>
            <div className="flex gap-1 bg-white/5 rounded-xl p-0.5">
              {RISK_OPTIONS.map(({ key, label, color }) => (
                <button
                  key={key}
                  onClick={() => setRiskType(key)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-medium transition ${
                    riskType === key
                      ? key === 'high'
                        ? 'bg-rose-500/20 text-rose-400'
                        : 'bg-emerald-500/20 text-emerald-400'
                      : 'text-muted hover:text-white'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Top limit */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted uppercase tracking-wide">Hiển thị</label>
            <div className="flex gap-1 bg-white/5 rounded-xl p-0.5">
              {TOP_OPTIONS.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setTopLimit(key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    topLimit === key
                      ? 'bg-primary-600/20 text-primary-400'
                      : 'text-muted hover:text-white'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {loading && <LoadingSpinner message="Từ từ... khoai sẽ nhừ bạn nhé!" />}
      {error && <p className="text-rose-400 text-center py-6">{error}</p>}

      {!loading && summary && (
        <>
          {/* ── Pie chart – Risk ratio ── */}
          <section className="card card-hover p-4 sm:p-6">
            <div className="flex items-center gap-2 mb-1">
              <Shield className="h-4 w-4 text-primary-400 flex-shrink-0" />
              <h3 className="text-base font-display font-bold text-white">
                Tỷ lệ rủi ro cao / rủi ro thấp — Năm {selectedYear}
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-muted mb-4">
              Biểu đồ thể hiện phân bổ hai nhóm rủi ro trong tổng số doanh nghiệp năm được chọn.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
              {/* Donut */}
              <div style={{ height: 220 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {pieData.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Pie>
                    <RTooltip content={<CustomPieTooltip />} />
                    <Legend
                      iconType="circle"
                      iconSize={10}
                      formatter={(value) => <span style={{ color: '#94A3B8', fontSize: 12 }}>{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              {/* Stats */}
              <div className="flex flex-col gap-3">
                {pieData.map((d) => (
                  <div key={d.name} className="flex items-center justify-between rounded-xl px-4 py-3 border" style={{ borderColor: d.fill + '30', backgroundColor: d.fill + '12' }}>
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: d.fill }} />
                      <span className="text-sm font-medium text-white">{d.name}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-display font-extrabold text-white">{d.value}</p>
                      <p className="text-[10px] text-muted">{d.pct}%</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <ChartCaption caption="Biểu đồ giúp bạn nắm bắt tỷ lệ phân bổ rủi ro của thị trường trong năm được chọn." />
          </section>

          {/* ── Results table ── */}
          <section className="card overflow-hidden">
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-white/6 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-base sm:text-lg font-display font-bold text-white">
                  {riskType === 'high' ? 'Rủi ro cao' : 'Rủi ro thấp'} — {selectedYear}
                </h3>
                <p className="text-xs text-muted mt-0.5">{filtered.length} doanh nghiệp</p>
              </div>
            </div>
            <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
              <table className="w-full text-xs sm:text-sm min-w-[400px]">
                <thead className="bg-surface-card text-muted sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">#</th>
                    <th className="px-4 py-3 text-left font-medium">Mã</th>
                    <th className="px-4 py-3 text-right font-medium">Score</th>
                    <th className="px-4 py-3 text-right font-medium">Percentile</th>
                    <th className="px-4 py-3 text-center font-medium">Nhãn</th>
                    <th className="px-4 py-3 text-center font-medium"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/4">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-muted text-xs">
                        Không có dữ liệu cho bộ lọc này.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((c, idx) => {
                      const ticker = tickerFromFirmId(c.firm_id || c.FIRM_ID || c.ticker || '');
                      const score = c.profit_score ?? c.p_t ?? c.score ?? null;
                      const pct = c.percentile_year ?? c.percentile ?? null;
                      const label = c.label_t ?? c.label;
                      const badge = riskBadge(label);
                      return (
                        <tr
                          key={ticker || idx}
                          className="hover:bg-white/3 transition cursor-pointer"
                          onClick={() => ticker && navigate(`/company/${ticker}`)}
                        >
                          <td className="px-4 py-3 text-muted">{idx + 1}</td>
                          <td className="px-4 py-3 font-semibold text-white">{ticker || '—'}</td>
                          <td className="px-4 py-3 text-right font-mono text-white">
                            {score != null ? safeNum(score, 2) : '—'}
                          </td>
                          <td className="px-4 py-3 text-right text-muted">
                            {pct != null ? `${safeNum(pct, 0)}` : '—'}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${badge.className}`}>
                              {badge.text}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            {ticker && (
                              <button
                                onClick={(e) => { e.stopPropagation(); navigate(`/company/${ticker}`); }}
                                className="p-1.5 rounded-lg hover:bg-white/10 text-muted hover:text-white transition"
                              >
                                <Eye className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
};

export default RiskFilter;
