import { useState, useEffect, useMemo } from 'react';
import { GitCompare, Plus, X, AlertTriangle, Eye } from 'lucide-react';
import {
  LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid,
  Tooltip as RTooltip, Legend, ResponsiveContainer,
} from 'recharts';
import apiService from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import ModelContextBar from '../components/ModelContextBar';
import PageIntro from '../components/PageIntro';
import ChartCaption from '../components/ChartCaption';
import Tooltip, { TOOLTIPS } from '../components/Tooltip';
import { safeNum, riskBadge, tickerFromFirmId } from '../utils/helpers';

const COLORS = ['#7C3AED', '#06B6D4', '#F59E0B', '#F43F5E'];

const Compare = () => {
  const [meta, setMeta] = useState(null);
  const [year, setYear] = useState(null);
  const [selectedTickers, setSelectedTickers] = useState([]);
  const [inputTicker, setInputTicker] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [comparison, setComparison] = useState([]);
  const [timeseriesMap, setTimeseriesMap] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    apiService.getMeta().then((m) => {
      setMeta(m);
      const years = m.years || [];
      if (years.length) setYear(Math.max(...years));
    }).catch(() => {});
  }, []);

  const firms = meta?.companies || meta?.firms || [];
  const years = meta?.years || [];

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

  const handleCompare = async () => {
    if (selectedTickers.length < 2 || !year) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiService.compareCompanies(selectedTickers, year);
      setComparison(res.comparison || []);
      const tsResults = {};
      await Promise.all(
        selectedTickers.map(async (t) => {
          try {
            const d = await apiService.getCompany(t);
            tsResults[t] = (d.timeseries || []).sort((a, b) => a.year - b.year);
          } catch { tsResults[t] = []; }
        })
      );
      setTimeseriesMap(tsResults);
    } catch (err) {
      console.error(err);
      setError('Không thể so sánh. Kiểm tra lại mã hoặc năm.');
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
      <ModelContextBar selectedYear={year} />
      <PageIntro
        text="Trang so sánh giúp bạn đặt nhiều doanh nghiệp lên cùng một khung để so điểm hiện tại và độ ổn định theo thời gian."
        note="Nội dung trên ProfitPulse chỉ phục vụ phân tích và không phải khuyến nghị mua bán."
      />

      {/* Inputs */}
      <section className="card p-4 sm:p-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <GitCompare className="h-5 w-5 text-primary-400" />
          <h2 className="text-base sm:text-lg font-display font-bold text-white">Chọn doanh nghiệp (2–4)</h2>
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
        <div className="flex items-end gap-3 flex-wrap">
          <div>
            <label className="block label-xs mb-1.5">Năm</label>
            <select value={year || ''} onChange={(e) => setYear(Number(e.target.value))} className={inputClasses}>
              {years.map((y) => (<option key={y} value={y}>{y}</option>))}
            </select>
          </div>
          <button onClick={handleCompare} disabled={selectedTickers.length < 2 || loading} className="btn-primary disabled:opacity-50">
            <GitCompare className="h-4 w-4" /> So sánh
          </button>
        </div>
      </section>

      {loading && <LoadingSpinner message="Đang so sánh..." />}
      {error && <p className="text-rose-400 text-center py-4">{error}</p>}

      {/* Comparison Table */}
      {!loading && comparison.length > 0 && (
        <section className="card overflow-hidden">
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-white/6">
            <h3 className="text-base sm:text-lg font-display font-bold text-white">So sánh năm {year}</h3>
            <p className="text-xs sm:text-sm text-muted">Chốt nhanh mã nào dẫn đầu và mã nào ở vùng rủi ro cao.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs sm:text-sm min-w-[580px]">
              <thead className="bg-white/3 text-muted">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Mã</th>
                  <th className="px-4 py-3 text-right font-medium"><Tooltip text={TOOLTIPS.profit_score}>Score</Tooltip></th>
                  <th className="px-4 py-3 text-right font-medium"><Tooltip text={TOOLTIPS.percentile}>Percentile</Tooltip></th>
                  <th className="px-4 py-3 text-center font-medium"><Tooltip text={TOOLTIPS.label_risk}>Nhãn</Tooltip></th>
                  <th className="px-4 py-3 text-right font-medium">PC1</th>
                  <th className="px-4 py-3 text-right font-medium">PC2</th>
                  <th className="px-4 py-3 text-right font-medium">PC3</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/6">
                {comparison.map((c, idx) => {
                  const firmId = c.FIRM_ID || c.firm_id;
                  const score = c.profit_score ?? c.score ?? c.p_t;
                  const badge = riskBadge(c.label_t ?? c.label);
                  return (
                    <tr key={idx} className="hover:bg-white/3 transition">
                      <td className="px-4 py-3 font-semibold text-white">{firmId}</td>
                      <td className="px-4 py-3 text-right font-mono text-white">{safeNum(score, 2)}</td>
                      <td className="px-4 py-3 text-right text-slate-300">{c.percentile_year ?? c.percentile ?? 'N/A'}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${badge.className}`}>{badge.text}</span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-slate-300">{safeNum(c.pc1, 2)}</td>
                      <td className="px-4 py-3 text-right font-mono text-slate-300">{safeNum(c.pc2, 2)}</td>
                      <td className="px-4 py-3 text-right font-mono text-slate-300">{safeNum(c.pc3, 2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {selectedTickers.some((t) => !(timeseriesMap[t]?.length)) && (
            <div className="px-6 py-3 bg-amber-500/10 text-amber-400 text-xs flex items-center gap-1">
              <AlertTriangle className="h-3.5 w-3.5" />
              Một số mã thiếu dữ liệu lịch sử — biểu đồ có thể không đầy đủ.
            </div>
          )}
        </section>
      )}

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
    </div>
  );
};

export default Compare;
