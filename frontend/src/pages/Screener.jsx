import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, SlidersHorizontal, Eye, Download, BarChart3 } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RTooltip, ResponsiveContainer, Cell,
} from 'recharts';
import apiService from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import PageIntro from '../components/PageIntro';
import ChartCaption from '../components/ChartCaption';
import Tooltip, { TOOLTIPS } from '../components/Tooltip';
import { safeNum, riskBadge, tickerFromFirmId, sortBy, exportToCSV } from '../utils/helpers';

const PURPLE = '#6366F1';
const CYAN = '#06B6D4';

const Screener = () => {
  const navigate = useNavigate();
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [year, setYear] = useState(null);
  const [minScore, setMinScore] = useState('');
  const [maxScore, setMaxScore] = useState('');
  const [limit, setLimit] = useState(50);
  const [results, setResults] = useState([]);
  const [totalResults, setTotalResults] = useState(0);
  const [sortKey, setSortKey] = useState('profit_score');
  const [sortOrder, setSortOrder] = useState('desc');

  useEffect(() => {
    apiService.getMeta().then((m) => {
      setMeta(m);
      const years = m.years || [];
      if (years.length) setYear(2024);
    }).catch(() => setError('Không thể tải metadata.'));
  }, []);

  const fetchScreener = async () => {
    if (!year) return;
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.screener({
        year,
        min_score: minScore || undefined,
        max_score: maxScore || undefined,
        limit,
      });
      setResults(data.results || []);
      setTotalResults(data.count ?? data.total_results ?? (data.results || []).length);
    } catch (err) {
      console.error(err);
      setError('Lỗi khi tải dữ liệu sàng lọc.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (year) fetchScreener();
  }, [year]);

  const sorted = useMemo(() => {
    if (!results.length) return [];
    return sortBy(results, sortKey, sortOrder);
  }, [results, sortKey, sortOrder]);

  const top10Chart = useMemo(() => {
    return [...results]
      .sort((a, b) => (b.profit_score ?? b.score ?? 0) - (a.profit_score ?? a.score ?? 0))
      .slice(0, 10)
      .map((r, i) => ({
        name: tickerFromFirmId(r.firm_id || r.FIRM_ID),
        score: r.profit_score ?? r.score ?? 0,
        fill: i % 2 === 0 ? PURPLE : CYAN,
      }));
  }, [results]);

  const handleSort = (key) => {
    if (key === sortKey) setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortOrder('desc'); }
  };

  const SortIcon = ({ col }) => {
    if (col !== sortKey) return null;
    return <span className="ml-1 text-primary-400">{sortOrder === 'asc' ? '▲' : '▼'}</span>;
  };

  const years = meta?.years || [];

  const inputClasses = 'w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 sm:py-2 text-white placeholder:text-muted focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition text-sm min-h-[40px]';
  const selectClasses = 'w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2.5 sm:py-2 text-white placeholder:text-muted focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition text-sm min-h-[40px]';

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageIntro
        text="Trang bộ lọc giúp bạn chọn nhanh nhóm doanh nghiệp theo năm và theo khoảng điểm lợi nhuận, để tìm ra các mã đáng xem mà không cần mở từng mã thủ công. Kết quả hiển thị điểm lợi nhuận, phân vị và nhãn rủi ro để bạn quyết định mã nào nên xem chi tiết tiếp."
      />

      {/* Filter Panel */}
      <section className="card p-4 sm:p-6">
        <div className="flex items-center gap-2 mb-3 sm:mb-4">
          <SlidersHorizontal className="h-5 w-5 text-primary-400" />
          <h2 className="text-base sm:text-lg font-display font-bold text-white">Bộ lọc</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 items-end">
          <div>
            <label className="block label-xs mb-1.5">Năm</label>
            <select value={year || ''} onChange={(e) => setYear(Number(e.target.value))} className={selectClasses}>
              {years.map((y) => (<option key={y} value={y}>{y}</option>))}
            </select>
          </div>
          <div>
            <label className="block label-xs mb-1.5">Min score</label>
            <input type="number" step="0.1" value={minScore} onChange={(e) => setMinScore(e.target.value)} placeholder="0" className={inputClasses} />
          </div>
          <div>
            <label className="block label-xs mb-1.5">Max score</label>
            <input type="number" step="0.1" value={maxScore} onChange={(e) => setMaxScore(e.target.value)} placeholder="10" className={inputClasses} />
          </div>
          <div>
            <label className="block label-xs mb-1.5">Số kết quả</label>
            <select value={limit} onChange={(e) => setLimit(Number(e.target.value))} className={selectClasses}>
              {[20, 50, 100, 200].map((n) => (<option key={n} value={n}>{n}</option>))}
            </select>
          </div>
          <button onClick={fetchScreener} disabled={loading} className="btn-primary disabled:opacity-50 col-span-2 sm:col-span-1 w-full">
            <Search className="h-4 w-4" /> Lọc
          </button>
        </div>
      </section>

      {loading && <LoadingSpinner message="Đang lọc doanh nghiệp..." />}
      {error && <p className="text-rose-400 text-center py-4">{error}</p>}

      {/* Mini Stats - P1.2 */}
      {!loading && results.length > 0 && (() => {
        const validScores = results.filter(r => (r.profit_score ?? r.score ?? r.p_t) != null);
        const avgScore = validScores.length > 0
          ? validScores.reduce((sum, r) => sum + (r.profit_score ?? r.score ?? r.p_t ?? 0), 0) / validScores.length
          : null;
        
        const highRiskCount = results.filter(r => (r.label_t ?? r.label) === 1 || (r.label_t ?? r.label) === '1').length;
        const highRiskShare = results.length > 0 ? (highRiskCount / results.length) * 100 : 0;
        
        const missingPercentile = results.filter(r => !r.percentile_year && !r.percentile).length;
        const missingPC = results.filter(r => r.pc1 == null || r.pc2 == null || r.pc3 == null).length;
        const missingDataShare = results.length > 0 
          ? ((missingPercentile + missingPC) / (results.length * 2)) * 100 
          : 0;

        return (
          <section className="card p-4 sm:p-6 bg-surface-100 border border-primary-500/10">
            <h3 className="text-sm font-semibold text-white mb-3">Kết quả thống kê</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white/5 p-3 rounded-xl">
                <p className="text-xs text-muted mb-1">Trung bình Profit Score</p>
                <p className="text-xl font-bold text-white">
                  {avgScore != null ? safeNum(avgScore, 2) : 'N/A'}
                </p>
              </div>
              <div className="bg-white/5 p-3 rounded-xl">
                <p className="text-xs text-muted mb-1">Tỷ lệ doanh nghiệp thuộc rủi ro cao</p>
                <p className="text-xl font-bold text-rose-400">
                  {highRiskShare.toFixed(1)}%
                </p>
              </div>
              <div className="bg-white/5 p-3 rounded-xl">
                <p className="text-xs text-muted mb-1">Mức độ thiếu sót dữ liệu</p>
                <p className="text-xl font-bold text-amber-400">
                  {missingDataShare.toFixed(1)}%
                </p>
              </div>
            </div>
          </section>
        );
      })()}

      {/* Top 10 bar chart — alternating purple/cyan */}
      {!loading && top10Chart.length > 0 && (
        <section className="card card-hover p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-display font-bold text-white mb-3">Top 10 doanh nghiệp xếp theo Profit Score</h3>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={top10Chart} layout="vertical" margin={{ left: 40, right: 8, top: 4, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis type="number" tick={{ fill: '#94A3B8', fontSize: 12 }} />
              <YAxis dataKey="name" type="category" tick={{ fill: '#94A3B8', fontSize: 12 }} />
              <RTooltip contentStyle={{ background: 'rgba(26,32,53,0.95)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12 }} />
              <Bar dataKey="score" radius={[0, 6, 6, 0]}>
                {top10Chart.map((d, i) => (
                  <Cell key={i} fill={d.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          </div>
          <ChartCaption caption="Biểu đồ xếp hạng top 10 doanh nghiệp từ trên xuống xếp theo Profit Score trong khoảng điểm và mốc thời gian bạn đã chọn." />
        </section>
      )}

      {/* Results table */}
      {!loading && sorted.length > 0 && (
        <section className="card overflow-hidden">
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-white/6 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h3 className="text-base sm:text-lg font-display font-bold text-white">Kết quả: {totalResults} doanh nghiệp</h3>
            <button onClick={() => exportToCSV(results, `screener_${year}.csv`)} className="text-sm text-primary-400 hover:text-primary-300 flex items-center gap-1 transition">
              <Download className="h-4 w-4" /> Xuất CSV
            </button>
          </div>
          <div className="overflow-x-auto max-h-[1000px] overflow-y-auto">
            <table className="w-full text-xs sm:text-sm min-w-[700px]">
              <thead className="text-muted sticky top-0 z-10" style={{ backgroundColor: '#131929' }}>
                <tr>
                  <th className="px-4 py-3 text-left font-medium">#</th>
                  <th className="px-4 py-3 text-left font-medium cursor-pointer select-none" onClick={() => handleSort('firm_id')}>Mã <SortIcon col="firm_id" /></th>
                  <th className="px-4 py-3 text-right font-medium cursor-pointer select-none" onClick={() => handleSort('profit_score')}><Tooltip text={TOOLTIPS.profit_score}>Score</Tooltip> <SortIcon col="profit_score" /></th>
                  <th className="px-4 py-3 text-right font-medium cursor-pointer select-none" onClick={() => handleSort('percentile_year')}><Tooltip text={TOOLTIPS.percentile}>Percentile</Tooltip> <SortIcon col="percentile_year" /></th>
                  <th className="px-4 py-3 text-center font-medium"><Tooltip text={TOOLTIPS.label_risk}>Nhãn</Tooltip></th>
                  <th className="px-4 py-3 text-right font-medium cursor-pointer select-none" onClick={() => handleSort('pc1')}>PC1 <SortIcon col="pc1" /></th>
                  <th className="px-4 py-3 text-center font-medium">Năm</th>
                  <th className="px-4 py-3 text-center font-medium"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/6">
                {sorted.map((r, idx) => {
                  const firmId = r.firm_id || r.FIRM_ID;
                  const ticker = tickerFromFirmId(firmId);
                  const badge = riskBadge(r.label_t ?? r.label);
                  const score = r.profit_score ?? r.score ?? r.p_t;
                  return (
                    <tr key={idx} className="hover:bg-white/3 transition">
                      <td className="px-4 py-3 text-muted">{idx + 1}</td>
                      <td className="px-4 py-3 font-semibold text-white">{firmId}</td>
                      <td className="px-4 py-3 text-right font-mono text-white">{safeNum(score, 2)}</td>
                      <td className="px-4 py-3 text-right text-slate-300">{r.percentile_year ?? 'N/A'}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${badge.className}`}>{badge.text}</span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-slate-300">{safeNum(r.pc1, 2)}</td>
                      <td className="px-4 py-3 text-center text-muted">{r.year || year}</td>
                      <td className="px-4 py-3 text-center">
                        <button onClick={() => navigate(`/company/${ticker}`)} className="text-primary-400 hover:text-primary-300 transition" title="Xem doanh nghiệp">
                          <Eye className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-muted px-6 py-3">Trend xem trong Company History. Hiện backend chưa có pagination.</p>
        </section>
      )}

      {/* Empty state */}
      {!loading && !error && sorted.length === 0 && (
        <div className="text-center py-16 card">
          <BarChart3 className="h-12 w-12 text-muted mx-auto mb-4" />
          <p className="text-white font-medium">Không tìm thấy kết quả</p>
          <p className="text-sm text-muted mt-1">Thử giảm min score, tăng max score hoặc đổi năm.</p>
        </div>
      )}
    </div>
  );
};

export default Screener;
