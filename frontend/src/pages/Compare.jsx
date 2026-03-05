import { useState, useEffect, useMemo } from 'react';
import { GitCompare, X, RotateCcw } from 'lucide-react';
import {
  LineChart, Line,
  XAxis, YAxis, CartesianGrid,
  Tooltip as RTooltip, Legend, ResponsiveContainer,
} from 'recharts';
import apiService from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import PageIntro from '../components/PageIntro';
import ChartCaption from '../components/ChartCaption';
import { safeNum, riskBadge } from '../utils/helpers';

const COLORS = ['#6366F1', '#22D3EE', '#F59E0B', '#F43F5E'];

const Compare = () => {
  const [meta, setMeta] = useState(null);
  const [selectedTickers, setSelectedTickers] = useState(['FPT', 'HPG', 'GAS', 'VNM']);
  const [inputTicker, setInputTicker] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [timeseriesMap, setTimeseriesMap] = useState({});
  const [companyDataMap, setCompanyDataMap] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    apiService.getMeta().then((m) => setMeta(m)).catch(() => {});
  }, []);

  const firms = meta?.companies || meta?.firms || [];

  useEffect(() => {
    if (inputTicker.length < 1) { setSuggestions([]); return; }
    const q = inputTicker.toUpperCase();
    setSuggestions(firms.filter((f) => f.toUpperCase().includes(q) && !selectedTickers.includes(f)).slice(0, 8));
  }, [inputTicker, firms, selectedTickers]);

  const addTicker = (t) => {
    if (selectedTickers.length >= 4) return;
    if (!selectedTickers.includes(t)) setSelectedTickers([...selectedTickers, t]);
    setInputTicker('');
    setSuggestions([]);
  };

  const removeTicker = (t) => setSelectedTickers(selectedTickers.filter((x) => x !== t));

  const handleReset = () => {
    setSelectedTickers(['FPT', 'HPG', 'GAS', 'VNM']);
    setTimeseriesMap({});
    setCompanyDataMap({});
    setError(null);
  };

  const handleCompare = async () => {
    if (selectedTickers.length < 2) return;
    setLoading(true);
    setError(null);
    try {
      const tsResults = {};
      const cdResults = {};
      await Promise.all(
        selectedTickers.map(async (t) => {
          try {
            const d = await apiService.getCompany(t, 2025);
            tsResults[t] = (d.timeseries || []).sort((a, b) => a.year - b.year);
            cdResults[t] = d;
          } catch { tsResults[t] = []; cdResults[t] = null; }
        })
      );
      setTimeseriesMap(tsResults);
      setCompanyDataMap(cdResults);
    } catch (err) {
      console.error(err);
      setError('Không thể so sánh. Kiểm tra lại mã.');
    } finally {
      setLoading(false);
    }
  };

  const chartData = useMemo(() => {
    const yearsSet = new Set();
    Object.values(timeseriesMap).forEach((ts) => ts.forEach((d) => yearsSet.add(d.year)));
    const allYears = [...yearsSet].sort((a, b) => a - b);
    return allYears.map((y) => {
      const point = { year: y };
      selectedTickers.forEach((t) => {
        const match = (timeseriesMap[t] || []).find((d) => d.year === y);
        point[t] = match ? match.profitscore : null;
      });
      return point;
    });
  }, [timeseriesMap, selectedTickers]);

  const inputClasses = 'bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 sm:py-2 text-white placeholder:text-muted text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition min-h-[40px]';
  const chartTooltipStyle = { background: 'rgba(26,32,53,0.95)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12 };

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageIntro
        text="Trang so sánh giúp bạn đặt nhiều doanh nghiệp lên cùng một khung thời gian để so sánh và đánh giá mức độ ổn định."
      />

      {/* Inputs */}
      <section className="card p-4 sm:p-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <GitCompare className="h-5 w-5 text-primary-400" />
          <h2 className="text-base sm:text-lg font-display font-bold text-white">Hãy lựa chọn các doanh nghiệp cần so sánh</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {selectedTickers.map((t) => (
            <span key={t} className="inline-flex items-center gap-1 bg-primary-600/20 text-primary-400 px-3 py-1 rounded-full text-sm font-medium">
              {t}
              <button onClick={() => removeTicker(t)} className="hover:text-rose-400 transition"><X className="h-3.5 w-3.5" /></button>
            </span>
          ))}
        </div>
        {selectedTickers.length < 4 && (
          <div className="relative max-w-xs">
            <input value={inputTicker} onChange={(e) => setInputTicker(e.target.value)} placeholder="Nhập mã (VD: FPT)" className={inputClasses + ' w-full'} onKeyDown={(e) => { if (e.key === 'Enter' && suggestions.length) addTicker(suggestions[0]); }} />
            {suggestions.length > 0 && (
              <div className="absolute z-50 w-full mt-1 rounded-xl shadow-lg max-h-48 overflow-y-auto" style={{ background: 'rgba(26,32,53,0.95)', border: '1px solid rgba(255,255,255,0.08)' }}>
                {suggestions.map((s) => (
                  <button key={s} onClick={() => addTicker(s)} className="w-full text-left px-4 py-2 hover:bg-white/5 text-sm text-white transition">{s}</button>
                ))}
              </div>
            )}
          </div>
        )}
        <div className="flex items-center gap-3">
          <button onClick={handleCompare} disabled={selectedTickers.length < 2 || loading} className="btn-primary disabled:opacity-50">
            <GitCompare className="h-4 w-4" /> So sánh
          </button>
          <button onClick={handleReset} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium bg-white/5 text-muted hover:bg-white/10 hover:text-white transition">
            <RotateCcw className="h-4 w-4" /> Reset
          </button>
        </div>
      </section>

      {loading && <LoadingSpinner message="Đang so sánh..." />}
      {error && <p className="text-rose-400 text-center py-4">{error}</p>}

      {/* Multi-line chart */}
      {!loading && chartData.length > 0 && selectedTickers.length >= 2 && (
        <section className="card card-hover p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-display font-bold text-white mb-1">Xu hướng điểm theo thời gian</h3>
          <p className="text-xs sm:text-sm text-muted mb-3 sm:mb-4">Mã nào ổn định hơn và mã nào biến động mạnh.</p>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="year" tick={{ fill: '#94A3B8', fontSize: 12 }} />
                <YAxis tick={{ fill: '#94A3B8', fontSize: 12 }} />
                <RTooltip contentStyle={chartTooltipStyle} labelFormatter={(l) => `Năm ${l}`} />
                <Legend />
                {selectedTickers.map((t, i) => (
                  <Line key={t} type="monotone" dataKey={t} name={t} stroke={COLORS[i % COLORS.length]} strokeWidth={2} dot={{ r: 3 }} connectNulls />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
          <ChartCaption caption="Biểu đồ cho bạn thấy mã nào ổn định hơn và mã nào biến động mạnh." />
        </section>
      )}

      {/* Comparison detail cards */}
      {!loading && Object.keys(companyDataMap).length > 0 && selectedTickers.length >= 2 && (
        <section className="space-y-4">
          <h3 className="text-base sm:text-lg font-display font-bold text-white">So sánh chi tiết</h3>
          <div className={`grid gap-4 grid-cols-1 ${ selectedTickers.length === 2 ? 'sm:grid-cols-2' : selectedTickers.length === 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-2 lg:grid-cols-4' }`}>
            {selectedTickers.map((t, i) => {
              const d = companyDataMap[t];
              if (!d) return (
                <div key={t} className="card p-4 sm:p-5 space-y-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="font-display font-bold text-white text-base">{t}</span>
                  </div>
                  <p className="text-xs text-muted">Không có dữ liệu</p>
                </div>
              );

              // Normalise: support both real Supabase nested format and profitpulse adapter flat format
              const score = d.latest_score?.profit_score ?? d.latest_score?.p_t ?? d.profitscore ?? null;
              const labelVal = d.latest_score?.label_t ?? d.label ?? null;
              const yearVal = d.latest_score?.year ?? d.year ?? null;
              const percentile = d.latest_score?.percentile ?? d.latest_score?.percentile_year ?? null;
              const pc1 = d.latest_score?.pc1 ?? null;
              const pc2 = d.latest_score?.pc2 ?? null;
              const pc3 = d.latest_score?.pc3 ?? null;
              const companyName = d.company?.company_name ?? null;
              const exchange = d.company?.exchange_name ?? null;

              // Financial metrics: real format has financial_data array, adapter has financial_metrics object
              const finRow = (d.financial_data && d.financial_data.length > 0)
                ? d.financial_data[0]
                : (d.financial_metrics || {});

              const badge = riskBadge(labelVal);

              return (
                <div key={t} className="card p-4 sm:p-5 space-y-4">
                  {/* Header */}
                  <div className="flex items-start gap-2 pb-2 border-b border-white/6">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1.5" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-display font-bold text-white text-base">{t}</span>
                        {yearVal && <span className="text-xs text-muted flex-shrink-0">Năm {yearVal}</span>}
                      </div>
                      {companyName && <p className="text-xs text-muted truncate mt-0.5">{companyName}{exchange ? ` · ${exchange}` : ''}</p>}
                    </div>
                  </div>

                  {/* Profit Score */}
                  <div>
                    <p className="label-xs mb-2">Profit Score</p>
                    <p className="text-2xl sm:text-3xl font-display font-extrabold text-white mb-1.5">
                      {score != null ? safeNum(score, 2) : 'N/A'}
                    </p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${badge.className}`}>{badge.text}</span>
                      {percentile != null && <span className="text-xs text-muted">Top {safeNum(100 - percentile, 0)}%</span>}
                    </div>
                  </div>

                  {/* Financial metrics */}
                  <div>
                    <p className="label-xs mb-2">Chỉ số tài chính</p>
                    <div className="space-y-2">
                      {[
                        { key: 'X1_ROA', label: 'ROA (%)' },
                        { key: 'X2_ROE', label: 'ROE (%)' },
                        { key: 'X3_ROC', label: 'ROC (%)' },
                        { key: 'X4_EPS', label: 'EPS (VND)' },
                        { key: 'X5_NPM', label: 'NPM (%)' },
                      ].map(({ key, label }) => {
                        const val = finRow[key] ?? null;
                        return (
                          <div key={key} className="flex items-center justify-between">
                            <span className="text-xs text-muted">{label}</span>
                            <span className="font-mono text-xs text-white font-medium">
                              {val != null ? safeNum(val, key === 'X4_EPS' ? 0 : 2) : 'N/A'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* PCA Components */}
                  {(pc1 != null || pc2 != null || pc3 != null) && (
                    <div>
                      <p className="label-xs mb-2">PCA Components</p>
                      <div className="space-y-2">
                        {[['PC1', pc1], ['PC2', pc2], ['PC3', pc3]].map(([name, val]) => (
                          <div key={name} className="flex items-center justify-between">
                            <span className="text-xs text-muted">{name}</span>
                            <span className="font-mono text-xs text-white font-medium">{val != null ? safeNum(val, 2) : 'N/A'}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
};

export default Compare;
