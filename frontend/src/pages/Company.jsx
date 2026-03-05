import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import {
  Building2, TrendingUp, AlertTriangle, Layers,
  Clock, Cpu, Info,
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid,
  Tooltip as RTooltip, Legend, ResponsiveContainer, Cell,
} from 'recharts';
import apiService from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import PageIntro from '../components/PageIntro';
import ChartCaption from '../components/ChartCaption';
import DataCoverageBadge from '../components/DataCoverageBadge';
import FinancialMetricsTable from '../components/FinancialMetricsTable';
import MetricTrendChart from '../components/MetricTrendChart';
import Tooltip, { TOOLTIPS } from '../components/Tooltip';
import {
  safeNum, riskBadge, percentileInterpretation, rankBucket,
  computeYoYDeltas, PC_DESCRIPTIONS,
  computeProxyCoverage, getMissingProxies, computeHistoricalCoverage,
  CHART_CAPTIONS,
} from '../utils/helpers';

const PURPLE = '#6366F1';
const CYAN = '#06B6D4';
const GREEN = '#10B981';
const ROSE = '#F43F5E';

const TABS = [
  { id: 'overview', label: 'Tổng quan', icon: Layers },
  { id: 'history', label: 'Lịch sử', icon: Clock },
  { id: 'drivers', label: 'Drivers', icon: Cpu },
];


const Company = () => {
  const { ticker } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState('overview');
  const [selectedYear, setSelectedYear] = useState(null);
  const [financialData, setFinancialData] = useState(null);

  useEffect(() => {
    if (!ticker) return;
    setLoading(true);
    setError(null);
    Promise.all([
      apiService.getCompany(ticker),
      apiService.getFinancialSeries(ticker).catch(() => ({ financial_data: [] }))
    ])
      .then(([companyData, finData]) => {
        setData(companyData);
        // Normalize proxies_raw column names: x1_roa→roa, x2_roe→roe, x3_roc→roc, x4_eps→eps, x5_npm→npm
        const rawFin = finData.financial_data || [];
        const normalized = rawFin.map((row) => ({
          ...row,
          roa: row.roa ?? row.x1_roa ?? row.X1_ROA ?? null,
          roe: row.roe ?? row.x2_roe ?? row.X2_ROE ?? null,
          roc: row.roc ?? row.x3_roc ?? row.X3_ROC ?? null,
          eps: row.eps ?? row.x4_eps ?? row.X4_EPS ?? null,
          npm: row.npm ?? row.x5_npm ?? row.X5_NPM ?? null,
        }));
        setFinancialData(normalized);
        setSelectedYear(companyData.latest_score?.year || null);
      })
      .catch((e) => {
        console.error(e);
        setError(`Không tìm thấy dữ liệu cho mã ${ticker}.`);
      })
      .finally(() => setLoading(false));
  }, [ticker]);

  const company = data?.company || {};
  const latest = data?.latest_score || {};
  const timeseries = useMemo(() => data?.timeseries || [], [data]);
  const predictions = data?.predictions || [];
  const tsWithDeltas = useMemo(() => computeYoYDeltas(timeseries), [timeseries]);

  // Financial data processing
  const financialSeries = useMemo(() => (financialData || []).sort((a, b) => a.year - b.year), [financialData]);
  const currentFinancial = useMemo(() => {
    if (!selectedYear || !financialSeries.length) return null;
    return financialSeries.find(f => f.year === selectedYear) || null;
  }, [selectedYear, financialSeries]);
  const previousFinancial = useMemo(() => {
    if (!selectedYear || !financialSeries.length) return null;
    return financialSeries.find(f => f.year === selectedYear - 1) || null;
  }, [selectedYear, financialSeries]);

  // Data coverage metrics
  const coverageYear = useMemo(() => {
    if (!currentFinancial) return 0;
    return computeProxyCoverage(currentFinancial);
  }, [currentFinancial]);
  const coverageHistorical = useMemo(() => {
    return computeHistoricalCoverage(financialSeries);
  }, [financialSeries]);
  const missingProxies = useMemo(() => {
    return getMissingProxies(currentFinancial);
  }, [currentFinancial]);

  const yearData = useMemo(() => {
    if (!selectedYear || !timeseries.length) return latest;
    const match = timeseries.find((t) => t.year === selectedYear);
    return match
      ? { ...latest, profit_score: match.profitscore, percentile: match.percentile, label_t: match.label, year: match.year }
      : latest;
  }, [selectedYear, timeseries, latest]);

  const availableYears = useMemo(
    () => [...new Set(timeseries.map((t) => t.year))].sort((a, b) => b - a),
    [timeseries]
  );

  if (loading) return <LoadingSpinner message="Từ từ... khoai sẽ nhừ" />;
  if (error) {
    return (
      <div className="text-center py-20">
        <AlertTriangle className="h-12 w-12 text-rose-400 mx-auto mb-4" />
        <p className="text-slate-300">{error}</p>
      </div>
    );
  }

  const badge = riskBadge(yearData.label_t);
  const interp = percentileInterpretation(yearData.percentile);
  const bucket = rankBucket(yearData.percentile);

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageIntro
        text="Trang doanh nghiệp giúp bạn xem chi tiết tình hình của doanh nghiệp."
      />

      {/* Header */}
      <section className="card p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="bg-primary-600/20 text-primary-400 p-2.5 sm:p-3 rounded-xl">
            <Building2 className="h-6 w-6 sm:h-7 sm:w-7" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-display font-extrabold text-white tracking-tight">{company.company_name || ticker}</h1>
            <p className="text-muted text-xs sm:text-sm">
              {company.ticker || ticker}
              {company.symbol && ` · ${company.symbol}`}
              {company.exchange_name && ` · ${company.exchange_name}`}
            </p>
          </div>
        </div>
        {currentFinancial && (
          <div className="w-full sm:w-auto sm:max-w-xs">
            <DataCoverageBadge
              availableYears={Math.round(coverageYear / 20)}
              totalYears={5}
              missingFields={missingProxies}
              showDetails={true}
            />
          </div>
        )}
      </section>

      {/* Tab Navigation */}
      <div className="flex gap-1 bg-surface-200 p-1 rounded-xl overflow-x-auto hide-scrollbar">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setTab(t.id)} className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-medium transition flex-1 justify-center whitespace-nowrap min-h-[40px] ${tab === t.id ? 'bg-primary-600/20 text-primary-400 shadow-glow' : 'text-muted hover:text-white hover:bg-white/5'}`}>
              <Icon className="h-4 w-4" /> {t.label}
            </button>
          );
        })}
      </div>

      {tab === 'overview' && <OverviewTab
        yearData={yearData}
        badge={badge}
        interp={interp}
        bucket={bucket}
        latest={latest}
        predictions={predictions}
        currentFinancial={currentFinancial}
        previousFinancial={previousFinancial}
      />}
      {tab === 'history' && <HistoryTab timeseries={timeseries} tsWithDeltas={tsWithDeltas} />}
      {tab === 'drivers' && <DriversTab 
        yearData={yearData} 
        latest={latest} 
        selectedYear={selectedYear} 
        tsWithDeltas={tsWithDeltas} 
        financialSeries={financialSeries}
        currentFinancial={currentFinancial}
        previousFinancial={previousFinancial}
      />}
    </div>
  );
};

/* OverviewTab */
const OverviewTab = ({
  yearData, badge, interp, bucket, latest, predictions,
  currentFinancial, previousFinancial,
}) => {
  const prob = predictions?.[0]?.probability;
  const predLabel = predictions?.[0]?.pred_label;
  const hasProbability = prob != null;

  return (
    <div className="space-y-4 sm:space-y-6 anim-stagger">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Card 1: Profit Score & Percentile */}
        <div className="card card-hover p-4 sm:p-6">
          <h3 className="label-xs mb-3"><Tooltip text={TOOLTIPS.profit_score}>Profit Score &amp; Percentile</Tooltip></h3>
          <p className="metric mb-1">{yearData.profit_score != null ? safeNum(yearData.profit_score, 2) : 'N/A'}</p>
          <div className="flex items-center gap-2 mb-3">
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${badge.className}`}>{badge.text}</span>
            <span className="text-sm text-muted">{bucket}</span>
          </div>
          <div className="text-sm text-slate-300 mb-2">
            <Tooltip text={TOOLTIPS.percentile}>Percentile:</Tooltip>{' '}
            <span className="font-semibold text-white">{yearData.percentile ?? 'N/A'}</span>
          </div>
          {interp && <p className="text-sm text-primary-400 font-medium">{interp}</p>}
          <p className="text-xs text-muted mt-3">Thẻ này cho bạn biết doanh nghiệp thuộc nhóm mạnh hay yếu tại thời điểm được xem.</p>
        </div>

        {/* Card 2: Drivers (PC1/PC2/PC3) */}
        <div className="card card-hover p-4 sm:p-6">
          <h3 className="label-xs mb-3">Drivers (PCA Components)</h3>
          <div className="space-y-3">
            {['pc1', 'pc2', 'pc3'].map((key) => {
              const val = latest[key] ?? yearData[key];
              const info = PC_DESCRIPTIONS[key];
              return (
                <div key={key} className="flex items-start justify-between">
                  <div>
                    <span className="text-sm font-semibold text-white">{info.label}</span>
                    <p className="text-xs text-muted leading-snug">{info.desc}</p>
                  </div>
                  <span className="font-mono text-sm font-semibold text-white ml-3 whitespace-nowrap">{val != null ? safeNum(val, 2) : 'N/A'}</span>
                </div>
              );
            })}
          </div>
          <p className="text-xs text-muted mt-4">Thẻ này cho bạn biết thành phần nào đóng góp nhiều nhất vào điểm lợi nhuận.</p>
        </div>

        {/* Card 3: Financial Snapshot — aligned in grid */}
        {currentFinancial && (() => {
          const fin = currentFinancial;
          const prev = previousFinancial;
          const metrics = [
            { key: 'roa', label: 'ROA', desc: 'Lợi nhuận trên tài sản', unit: '%', color: '#6366F1' },
            { key: 'roe', label: 'ROE', desc: 'Lợi nhuận trên vốn chủ sở hữu', unit: '%', color: '#8B5CF6' },
            { key: 'roc', label: 'ROC', desc: 'Lợi nhuận trên vốn đầu tư', unit: '%', color: '#06B6D4' },
            { key: 'npm', label: 'NPM', desc: 'Tỷ suất lợi nhuận ròng', unit: '%', color: '#F59E0B' },
            { key: 'eps', label: 'EPS', desc: 'Lợi nhuận mỗi cổ phiếu', unit: 'VND', color: '#10B981' },
          ];
          return (
            <div className="card card-hover p-4 sm:p-6">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="h-4 w-4 text-primary-400 flex-shrink-0" />
                <h3 className="label-xs">Chỉ số tài chính năm {fin.year}</h3>
              </div>
              <div className="space-y-3">
                {metrics.map(({ key, label, desc, unit, color }) => {
                  const val = fin[key];
                  const prevVal = prev?.[key];
                  const hasVal = val != null && !isNaN(val);
                  const diff = (hasVal && prevVal != null && !isNaN(prevVal)) ? val - prevVal : null;
                  const isEPS = unit === 'VND';
                  const displayVal = hasVal
                    ? isEPS
                      ? Number(val).toLocaleString('vi-VN', { maximumFractionDigits: 0 })
                      : `${Number(val).toFixed(2)}%`
                    : 'N/A';
                  return (
                    <div key={key} className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <span className="text-sm font-semibold text-white">{label}</span>
                        <p className="text-xs text-muted leading-snug">{desc}</p>
                        {diff != null && (
                          <p className={`text-[10px] font-medium mt-0.5 ${
                            diff > 0 ? 'text-emerald-400' : diff < 0 ? 'text-rose-400' : 'text-muted'
                          }`}>
                            {diff > 0 ? '+' : ''}{isEPS
                              ? Number(diff).toLocaleString('vi-VN', { maximumFractionDigits: 0 })
                              : diff.toFixed(2)} vs năm trước
                          </p>
                        )}
                      </div>
                      <span
                        className="font-mono text-sm font-semibold whitespace-nowrap flex-shrink-0"
                        style={{ color: hasVal ? color : '#94A3B8' }}
                      >{displayVal}</span>
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-muted mt-4">Dữ liệu tài chính tổng hợp theo năm {fin.year}.</p>
            </div>
          );
        })()}
      </div>
    </div>
  );
};

/* HistoryTab */
const HistoryTab = ({ timeseries, tsWithDeltas }) => {
  if (!timeseries.length) {
    return <p className="text-muted text-center py-8">Không có dữ liệu lịch sử.</p>;
  }

  const sorted = [...timeseries].sort((a, b) => a.year - b.year);
  const labelChartData = sorted.map((d) => ({
    year: d.year,
    label: d.label,
    // label = 1 (P_t > 0) → Rủi ro thấp; label = 0 (P_t < 0) → Rủi ro cao
    labelText: d.label === 1 ? 'Thấp' : d.label === 0 ? 'Cao' : 'N/A',
  }));

  const chartTooltipStyle = { background: 'rgba(26,32,53,0.95)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12 };

  return (
    <div className="space-y-4 sm:space-y-6 anim-stagger">
      <p className="text-xs sm:text-sm text-muted italic">Tab này giúp bạn nhìn xu hướng để tránh kết luận chỉ từ một năm.</p>

      {/* Profit Score — area chart with gradient fill */}
      <div className="card card-hover p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-display font-bold text-white mb-1">Điểm lợi nhuận theo thời gian</h3>
        <div className="overflow-x-auto"><div className="chart-container">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={sorted}>
            <defs>
              <linearGradient id="gradScorePurple" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={PURPLE} stopOpacity={0.35} />
                <stop offset="100%" stopColor={PURPLE} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="year" tick={{ fill: '#94A3B8', fontSize: 12 }} />
            <YAxis tick={{ fill: '#94A3B8', fontSize: 12 }} />
            <RTooltip contentStyle={chartTooltipStyle} formatter={(v, n) => [safeNum(v, 2), n === 'profitscore' ? 'Score' : n]} labelFormatter={(l) => `Năm ${l}`} />
            <Area type="monotone" dataKey="profitscore" name="Profit Score" stroke={PURPLE} fill="url(#gradScorePurple)" strokeWidth={2} dot={{ r: 4, fill: PURPLE }} />
          </AreaChart>
        </ResponsiveContainer>
        </div></div>
        <ChartCaption caption="Biểu đồ cho bạn thấy điểm đang tăng hay giảm qua các năm." />
      </div>

      {/* Percentile — area chart with cyan gradient */}
      <div className="card card-hover p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-display font-bold text-white mb-1">Phân vị theo thời gian</h3>
        <div className="overflow-x-auto"><div className="chart-container">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={sorted}>
            <defs>
              <linearGradient id="gradPercCyan" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={CYAN} stopOpacity={0.35} />
                <stop offset="100%" stopColor={CYAN} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="year" tick={{ fill: '#94A3B8', fontSize: 12 }} />
            <YAxis domain={[0, 100]} tick={{ fill: '#94A3B8', fontSize: 12 }} />
            <RTooltip contentStyle={chartTooltipStyle} labelFormatter={(l) => `Năm ${l}`} />
            <Area type="monotone" dataKey="percentile" name="Percentile" stroke={CYAN} fill="url(#gradPercCyan)" strokeWidth={2} dot={{ r: 4, fill: CYAN }} />
          </AreaChart>
        </ResponsiveContainer>
        </div></div>
        <ChartCaption caption="Biểu đồ cho bạn thấy vị trí thị trường đang lên hay xuống." />
      </div>

      {/* Risk label bar chart */}
      <div className="card card-hover p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-display font-bold text-white mb-1">Nhãn rủi ro theo năm</h3>
        <div className="h-[160px] sm:h-[180px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={labelChartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="year" tick={{ fill: '#94A3B8', fontSize: 12 }} />
            <YAxis domain={[0, 1]} ticks={[0, 1]} tickFormatter={(v) => (v === 1 ? 'Cao' : 'Thấp')} tick={{ fill: '#94A3B8', fontSize: 12 }} />
            <RTooltip contentStyle={chartTooltipStyle} formatter={(val) => [val === 1 ? 'Risk Cao' : 'Risk Thấp', 'Nhãn']} labelFormatter={(l) => `Năm ${l}`} />
            <Bar dataKey="label" name="Risk Label" radius={[4, 4, 0, 0]}>
              {labelChartData.map((d, i) => (<Cell key={i} fill={d.label === 1 ? ROSE : GREEN} />))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        </div>
        <ChartCaption caption="Biểu đồ cho bạn thấy năm nào doanh nghiệp đổi trạng thái rủi ro." />
      </div>

      {/* YoY Delta Table */}
      {tsWithDeltas.length > 1 && (
        <div className="card overflow-hidden">
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-white/6">
            <h3 className="text-base sm:text-lg font-display font-bold text-white">Thay đổi qua từng năm</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs sm:text-sm min-w-[560px]">
              <thead className="bg-white/3 text-muted">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Năm</th>
                  <th className="px-4 py-3 text-right font-medium">Score</th>
                  <th className="px-4 py-3 text-right font-medium">Δ Score</th>
                  <th className="px-4 py-3 text-right font-medium">Percentile</th>
                  <th className="px-4 py-3 text-right font-medium">Δ Percentile</th>
                  <th className="px-4 py-3 text-center font-medium">Risk Flip</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/6">
                {tsWithDeltas.map((d, i) => (
                  <tr key={i} className="hover:bg-white/3 transition">
                    <td className="px-4 py-3 font-medium text-white">{d.year}</td>
                    <td className="px-4 py-3 text-right font-mono text-white">{safeNum(d.profitscore, 2)}</td>
                    <td className={`px-4 py-3 text-right font-mono ${d.delta_score > 0 ? 'text-emerald-400' : d.delta_score < 0 ? 'text-rose-400' : 'text-muted'}`}>
                      {d.delta_score != null ? (d.delta_score > 0 ? '+' : '') + safeNum(d.delta_score, 2) : '—'}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-300">{d.percentile ?? 'N/A'}</td>
                    <td className={`px-4 py-3 text-right font-mono ${d.delta_percentile > 0 ? 'text-emerald-400' : d.delta_percentile < 0 ? 'text-rose-400' : 'text-muted'}`}>
                      {d.delta_percentile != null ? (d.delta_percentile > 0 ? '+' : '') + safeNum(d.delta_percentile, 1) : '—'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {d.risk_flip ? <span className="text-rose-400 font-semibold">⚠ Đổi</span> : <span className="text-muted">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

/* DriversTab */
const DriversTab = ({ 
  yearData, latest, selectedYear, tsWithDeltas, 
  financialSeries, currentFinancial, previousFinancial
}) => {
  const pc1 = latest.pc1 ?? yearData.pc1;
  const pc2 = latest.pc2 ?? yearData.pc2;
  const pc3 = latest.pc3 ?? yearData.pc3;

  const pcData = [
    { name: 'PC1', value: pc1 ?? 0, fill: PURPLE },
    { name: 'PC2', value: pc2 ?? 0, fill: CYAN },
    { name: 'PC3', value: pc3 ?? 0, fill: '#F59E0B' },
  ];

  const hints = [];
  if (pc2 != null && pc2 < -1) hints.push('PC2 rất âm → EPS là điểm cần kiểm tra.');
  if (pc1 != null && pc1 < 0) hints.push('PC1 âm → Hiệu quả sinh lời cốt lõi (ROA/ROE/ROC/NPM) đang yếu.');
  if (pc3 != null && pc3 < -1) hints.push('PC3 rất âm → chất lượng lợi nhuận (EPS+NPM) cần lưu ý.');

  const chartTooltipStyle = { background: 'rgba(26,32,53,0.95)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12 };

  return (
    <div className="space-y-4 sm:space-y-6 anim-stagger">
      {/* Component drivers bar chart */}
      <div className="card card-hover p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-display font-bold text-white mb-1">Component Drivers — Năm {selectedYear}</h3>
        <div className="overflow-x-auto"><div className="chart-container">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={pcData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="name" tick={{ fill: '#94A3B8', fontSize: 12 }} />
            <YAxis tick={{ fill: '#94A3B8', fontSize: 12 }} />
            <RTooltip contentStyle={chartTooltipStyle} />
            <Bar dataKey="value" name="Giá trị" radius={[6, 6, 0, 0]}>
              {pcData.map((d, i) => (<Cell key={i} fill={d.fill} />))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        </div></div>
        <ChartCaption caption={CHART_CAPTIONS.company_pc_breakdown} />
        <div className="mt-3 sm:mt-4 space-y-2">
          {['pc1', 'pc2', 'pc3'].map((key) => {
            const info = PC_DESCRIPTIONS[key];
            const val = key === 'pc1' ? pc1 : key === 'pc2' ? pc2 : pc3;
            return (
              <div key={key} className="flex items-start gap-2 sm:gap-3 text-xs sm:text-sm">
                <span className="font-semibold text-white w-10">{info.label}</span>
                <span className="text-muted flex-1">{info.desc}</span>
                <span className="font-mono text-white">{val != null ? safeNum(val, 2) : 'N/A'}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Financial Metrics Trend - P0.1 */}
      {financialSeries && financialSeries.length > 0 && (
        <div className="card card-hover p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-display font-bold text-white mb-1">
            Financial Metrics Trend
          </h3>
          <p className="text-xs sm:text-sm text-muted mb-4">
            Biểu đồ cho bạn thấy ROA ROE ROC EPS NPM đang cải thiện hay suy giảm theo thời gian.
          </p>
          <MetricTrendChart 
            data={financialSeries}
            defaultMetric="roa"
            showSelector={true}
            height={300}
          />
        </div>
      )}

      {/* Financial Metrics Table with YoY - P0.1 */}
      {currentFinancial && (
        <div className="card card-hover p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-display font-bold text-white mb-1">
            Financial Metrics — Năm {selectedYear}
          </h3>
          <p className="text-xs sm:text-sm text-muted mb-4">
            Bảng cho bạn thấy mức thay đổi so với năm trước để nhận ra biến động mạnh hay nhẹ.
          </p>
          <FinancialMetricsTable 
            currentYear={currentFinancial}
            previousYear={previousFinancial}
            showBadges={true}
            showYoY={!!previousFinancial}
            compact={false}
          />
        </div>
      )}

      {/* Score decomposition */}
      <div className="card p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-display font-bold text-white mb-2">Score Decomposition (Informational)</h3>
        <div className="bg-primary-600/8 border border-primary-500/15 rounded-xl p-4 text-sm text-slate-300">
          <p className="mb-2"><strong className="text-white">P_t = ω₁·PC1 + ω₂·PC2 + ω₃·PC3</strong></p>
          <p className="text-xs text-muted">Trọng số ω hiện chưa được trả về qua API. Phần này chỉ mang tính minh hoạ cấu trúc.</p>
        </div>
      </div>

      {/* Action hints */}
      {hints.length > 0 && (
        <div className="card p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-display font-bold text-white mb-3">Gợi ý phân tích</h3>
          <ul className="space-y-2">
            {hints.map((h, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-amber-400">
                <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>{h}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* YoY table */}
      {tsWithDeltas.length > 1 && (
        <div className="card overflow-hidden">
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-white/6">
            <h3 className="text-base sm:text-lg font-display font-bold text-white">Thay đổi điểm & phân vị theo năm</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs sm:text-sm min-w-[500px]">
              <thead className="bg-white/3 text-muted">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Năm</th>
                  <th className="px-4 py-3 text-right font-medium">Score</th>
                  <th className="px-4 py-3 text-right font-medium">Δ Score</th>
                  <th className="px-4 py-3 text-right font-medium">Percentile</th>
                  <th className="px-4 py-3 text-right font-medium">Δ Percentile</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/6">
                {tsWithDeltas.map((d, i) => (
                  <tr key={i} className="hover:bg-white/3 transition">
                    <td className="px-4 py-3 font-medium text-white">{d.year}</td>
                    <td className="px-4 py-3 text-right font-mono text-white">{safeNum(d.profitscore, 2)}</td>
                    <td className={`px-4 py-3 text-right font-mono ${d.delta_score > 0 ? 'text-emerald-400' : d.delta_score < 0 ? 'text-rose-400' : 'text-muted'}`}>
                      {d.delta_score != null ? (d.delta_score > 0 ? '+' : '') + safeNum(d.delta_score, 2) : '—'}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-300">{d.percentile ?? 'N/A'}</td>
                    <td className={`px-4 py-3 text-right font-mono ${d.delta_percentile > 0 ? 'text-emerald-400' : d.delta_percentile < 0 ? 'text-rose-400' : 'text-muted'}`}>
                      {d.delta_percentile != null ? (d.delta_percentile > 0 ? '+' : '') + safeNum(d.delta_percentile, 1) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Company;
