import { useState, useEffect, useMemo, useCallback } from 'react';
import { GitCompare, X, RotateCcw, TrendingUp } from 'lucide-react';
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
const DEFAULT_TICKERS = ['FPT', 'HPG', 'GAS', 'VNM'];

const Compare = () => {
  const [meta, setMeta] = useState(null);
  const [selectedTickers, setSelectedTickers] = useState(DEFAULT_TICKERS);
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
    setSelectedTickers(DEFAULT_TICKERS);
    setTimeseriesMap({});
    setCompanyDataMap({});
    setError(null);
  };

  const runCompare = useCallback(async (tickers) => {
    if (tickers.length < 2) return;
    setLoading(true);
    setError(null);
    try {
      const tsResults = {};
      const cdResults = {};
      await Promise.all(
        tickers.map(async (t) => {
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
  }, []);

  const handleCompare = () => runCompare(selectedTickers);

  // Auto-run on mount with default tickers
  useEffect(() => {
    runCompare(DEFAULT_TICKERS);
  }, [runCompare]);

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

      {/* ── Side-by-side comparison sections ── */}
      {!loading && Object.keys(companyDataMap).length > 0 && selectedTickers.length >= 2 && (() => {
        // Pre-compute normalised data for each ticker
        const dataOf = (t) => {
          const d = companyDataMap[t];
          if (!d) return null;
          const score      = d.latest_score?.profit_score ?? d.latest_score?.p_t ?? d.profitscore ?? null;
          const labelVal   = d.latest_score?.label_t ?? d.label ?? null;
          const yearVal    = d.latest_score?.year ?? d.year ?? null;
          const percentile = d.latest_score?.percentile ?? d.latest_score?.percentile_year ?? null;
          const pc1        = d.latest_score?.pc1 ?? null;
          const pc2        = d.latest_score?.pc2 ?? null;
          const pc3        = d.latest_score?.pc3 ?? null;
          const companyName = d.company?.company_name ?? null;
          return { score, labelVal, yearVal, percentile, pc1, pc2, pc3, companyName };
        };

        const infos = selectedTickers.map((t) => ({ ticker: t, ...dataOf(t) }));

        // Helper: find best value index for a metric (higher = better)
        const bestIdx = (vals) => {
          let idx = -1; let best = -Infinity;
          vals.forEach((v, i) => { if (v != null && v > best) { best = v; idx = i; } });
          return idx;
        };

        const colCls = selectedTickers.length === 2 ? 'grid-cols-2'
          : selectedTickers.length === 3 ? 'grid-cols-3'
          : 'grid-cols-2 sm:grid-cols-4';

        return (
          <div className="space-y-4 sm:space-y-6">

            {/* ── 1. Profit Score & Percentile ── */}
            <section className="card p-4 sm:p-6">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="h-4 w-4 text-primary-400 flex-shrink-0" />
                <h3 className="text-base font-display font-bold text-white">Profit Score &amp; Percentile</h3>
              </div>
              <div className={`grid gap-3 ${colCls}`}>
                {infos.map((info, i) => {
                  if (!info) return <div key={info?.ticker ?? i} className="rounded-xl border border-white/8 p-3 text-center"><p className="text-xs text-muted">{selectedTickers[i]} — N/A</p></div>;
                  const badge = riskBadge(info.labelVal);
                  const scoreNums = infos.map((x) => x?.score ?? null);
                  const isBest = bestIdx(scoreNums) === i;
                  return (
                    <div key={info.ticker} className={`rounded-xl border p-3 sm:p-4 flex flex-col gap-1.5 ${isBest ? 'border-primary-500/40 bg-primary-600/10' : 'border-white/8 bg-white/2'}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                        <span className="font-bold text-white text-sm">{info.ticker}</span>
                        {isBest && <span className="ml-auto text-[10px] font-semibold text-primary-400 bg-primary-600/20 px-1.5 py-0.5 rounded-full">Tốt nhất</span>}
                      </div>
                      {info.companyName && <p className="text-[10px] text-muted truncate -mt-1">{info.companyName}</p>}
                      <p className="text-2xl sm:text-3xl font-display font-extrabold text-white leading-none mt-1">
                        {info.score != null ? safeNum(info.score, 2) : 'N/A'}
                      </p>
                      <div className="flex items-center gap-2 flex-wrap mt-0.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${badge.className}`}>{badge.text}</span>
                        {info.percentile != null && (
                          <span className="text-[10px] text-muted">Top {safeNum(100 - info.percentile, 0)}%</span>
                        )}
                      </div>
                      {info.yearVal && <p className="text-[10px] text-muted/60 mt-0.5">Năm {info.yearVal}</p>}
                    </div>
                  );
                })}
              </div>
            </section>


          </div>
        );
      })()}
    </div>
  );
};

export default Compare;
