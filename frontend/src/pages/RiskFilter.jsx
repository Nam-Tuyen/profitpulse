import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Eye, Calendar, Filter, ChevronDown } from 'lucide-react';
import {
  PieChart, Pie, Cell, Tooltip as RTooltip, ResponsiveContainer,
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
  { key: 'low', label: 'Rủi ro thấp', color: 'emerald' },
  { key: 'high', label: 'Rủi ro cao', color: 'rose' },
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
  const [yearOpen, setYearOpen] = useState(false);
  const [riskType, setRiskType] = useState('low');

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
    return allCompanies.filter((c) => {
      const label = c.label_t ?? c.label;
      // label = 0 (P_t < 0) → Rủi ro cao; label = 1 (P_t > 0) → Rủi ro thấp
      const isHigh = label === 0 || label === '0';
      return riskType === 'high' ? isHigh : !isHigh;
    });
  }, [allCompanies, riskType]);

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
      <section className="card p-3 sm:p-4">
        <div className="flex flex-row flex-wrap items-end gap-2 sm:gap-4">
          {/* Year dropdown */}
          <div className="flex flex-col gap-1 w-auto">
            <label className="text-[10px] font-medium text-muted uppercase tracking-wide flex items-center gap-1">
              <Calendar className="h-3 w-3 text-primary-400" /> Năm
            </label>
            <div className="relative">
              <button
                onClick={() => setYearOpen((o) => !o)}
                className="flex items-center justify-between gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs font-bold text-white hover:bg-white/8 transition-all w-full sm:min-w-[120px]"
              >
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-400 flex-shrink-0" />
                  {selectedYear || 'Chọn năm'}
                </span>
                <ChevronDown className={`h-3.5 w-3.5 text-muted transition-transform duration-200 ${yearOpen ? 'rotate-180' : ''}`} />
              </button>
              {yearOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setYearOpen(false)} />
                  <div className="absolute top-full mt-2 left-0 z-20 border border-white/10 rounded-xl shadow-2xl overflow-hidden w-full" style={{ background: 'rgba(15,23,42,0.98)' }}>
                    <div className="overflow-y-auto" style={{ maxHeight: '178px' }}>
                      {displayYears.map((y) => (
                        <button
                          key={y}
                          onClick={() => { setSelectedYear(y); setYearOpen(false); }}
                          className={`w-full px-3 py-2 text-xs font-semibold text-left transition-colors flex items-center gap-1.5 ${
                            selectedYear === y
                              ? 'bg-primary-600/20 text-primary-400'
                              : 'text-muted hover:bg-white/5 hover:text-white'
                          }`}
                        >
                          {selectedYear === y && <span className="w-1.5 h-1.5 rounded-full bg-primary-400 flex-shrink-0" />}
                          {y}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Divider */}
          <div className="block w-px self-stretch bg-white/8" />

          {/* Risk type */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-medium text-muted uppercase tracking-wide flex items-center gap-1">
              <Shield className="h-3 w-3 text-primary-400" /> Mức độ rủi ro
            </label>
            <div className="flex gap-0.5 bg-white/5 border border-white/10 rounded-lg p-0.5">
              {RISK_OPTIONS.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setRiskType(key)}
                  className={`flex-1 px-3 py-1.5 rounded-md text-[11px] font-semibold transition ${
                    riskType === key
                      ? key === 'high'
                        ? 'bg-rose-500/25 text-rose-400 ring-1 ring-rose-500/30'
                        : 'bg-emerald-500/25 text-emerald-400 ring-1 ring-emerald-500/30'
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

      {loading && <LoadingSpinner message="Từ từ... khoai sẽ nhừ" />}
      {error && <p className="text-rose-400 text-center py-6">{error}</p>}

      {!loading && summary && (
        <>
          {/* ── Pie chart – Risk ratio ── */}
          <section className="card card-hover p-3 sm:p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary-600/15 border border-primary-500/20 flex-shrink-0">
                  <Shield className="h-3.5 w-3.5 text-primary-400" />
                </div>
                <div>
                  <h3 className="text-sm font-display font-bold text-white">Phân bổ rủi ro</h3>
                  <p className="text-[11px] text-muted">Năm {selectedYear}</p>
                </div>
              </div>
              {/* Inline legend */}
              <div className="flex items-center gap-3">
                {pieData.map((d) => (
                  <span key={d.name} className="flex items-center gap-1 text-[10px] text-muted">
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: d.fill }} />
                    {d.name}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch">
              {/* Donut – no Legend inside, so cy=50% is truly centered */}
              <div className="h-[130px] sm:h-[140px] w-full sm:w-[160px] flex-shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={38}
                      outerRadius={56}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {pieData.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Pie>
                    <RTooltip content={<CustomPieTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Stats cards */}
              <div className="flex flex-col gap-2 flex-1 justify-center">
                {pieData.map((d) => {
                  const isHigh = d.name === 'Rủi ro cao';
                  return (
                    <div key={d.name} className="relative rounded-xl p-2.5 border overflow-hidden" style={{ borderColor: d.fill + '30', backgroundColor: d.fill + '0d' }}>
                      <div className="absolute inset-y-0 left-0 w-1 rounded-l-xl" style={{ backgroundColor: d.fill }} />
                      <div className="flex items-center justify-between pl-2">
                        <div className="flex flex-col">
                          <span className="text-[9px] text-muted font-mono leading-tight">{isHigh ? 'label = 0 · P_t < 0' : 'label = 1 · P_t > 0'}</span>
                          <span className="text-xs font-semibold text-white leading-tight">{d.name}</span>
                        </div>
                        <div className="text-right">
                          <p className="text-base font-display font-extrabold text-white leading-none">{d.value} <span className="text-[11px] font-semibold" style={{ color: d.fill }}>{d.pct}%</span></p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <ChartCaption caption="Biểu đồ giúp người dùng quan sát được mức độ phân bổ rủi ro của các doanh nghiệp trong năm." />
          </section>

          {/* ── Results table ── */}
          <section className="card overflow-hidden">
            <div className="px-4 sm:px-6 py-4 border-b border-white/6 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-white/5 border border-white/8 flex-shrink-0">
                  <Eye className="h-3.5 w-3.5 text-primary-400" />
                </div>
                <h3 className="text-base sm:text-lg font-display font-bold text-white">Danh sách công ty sau khi lọc</h3>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-white/5 border border-white/8 text-muted">
                {filtered.length} công ty
              </span>
            </div>
            <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
              <table className="w-full text-xs sm:text-sm">
                <thead className="bg-surface-card text-muted sticky top-0 z-10">
                  <tr>
                    <th className="px-2.5 py-2.5 sm:px-4 sm:py-3 text-left font-medium text-[11px] uppercase tracking-wide">#</th>
                    <th className="px-2.5 py-2.5 sm:px-4 sm:py-3 text-left font-medium text-[11px] uppercase tracking-wide">Mã CK</th>
                    <th className="px-2.5 py-2.5 sm:px-4 sm:py-3 text-right font-medium text-[11px] uppercase tracking-wide">Profit Score</th>
                    <th className="hidden sm:table-cell px-4 py-3 text-right font-medium text-[11px] uppercase tracking-wide">Percentile</th>
                    <th className="px-2.5 py-2.5 sm:px-4 sm:py-3 text-center font-medium text-[11px] uppercase tracking-wide">Nhãn rủi ro</th>
                    <th className="hidden sm:table-cell px-4 py-3 text-center font-medium text-[11px]"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/4">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                            <Filter className="h-4 w-4 text-muted" />
                          </div>
                          <p className="text-muted text-xs">Không có dữ liệu cho bộ lọc này.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filtered.map((c, idx) => {
                      const ticker = tickerFromFirmId(c.firm_id || c.FIRM_ID || c.ticker || '');
                      const score = c.profit_score ?? c.p_t ?? c.score ?? null;
                      const pct = c.percentile_year ?? c.percentile ?? null;
                      const label = c.label_t ?? c.label;
                      const badge = riskBadge(label);
                      const isTop3 = idx < 3;
                      return (
                        <tr
                          key={ticker || idx}
                          className="hover:bg-white/3 transition cursor-pointer group"
                          onClick={() => ticker && navigate(`/company/${ticker}`)}
                        >
                          <td className="px-2.5 py-2.5 sm:px-4 sm:py-3">
                            {isTop3 ? (
                              <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold ${
                                idx === 0 ? 'bg-amber-500/20 text-amber-400' :
                                idx === 1 ? 'bg-slate-400/15 text-slate-300' :
                                'bg-orange-600/15 text-orange-400'
                              }`}>{idx + 1}</span>
                            ) : (
                              <span className="text-muted">{idx + 1}</span>
                            )}
                          </td>
                          <td className="px-2.5 py-2.5 sm:px-4 sm:py-3">
                            <span className="font-bold text-white tracking-wide">{ticker || '—'}</span>
                          </td>
                          <td className="px-2.5 py-2.5 sm:px-4 sm:py-3 text-right">
                            <span className="font-mono font-semibold text-white">{score != null ? safeNum(score, 2) : '—'}</span>
                          </td>
                          <td className="hidden sm:table-cell px-4 py-3 text-right">
                            <span className="text-muted">{pct != null ? `${safeNum(pct, 0)}` : '—'}</span>
                          </td>
                          <td className="px-2.5 py-2.5 sm:px-4 sm:py-3 text-center">
                            <span className={`px-1.5 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[10px] font-semibold ${badge.className}`}>
                              {badge.text}
                            </span>
                          </td>
                          <td className="hidden sm:table-cell px-4 py-3 text-center">
                            {ticker && (
                              <button
                                onClick={(e) => { e.stopPropagation(); navigate(`/company/${ticker}`); }}
                                className="p-1.5 rounded-lg hover:bg-white/10 text-muted hover:text-white transition opacity-0 group-hover:opacity-100"
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
