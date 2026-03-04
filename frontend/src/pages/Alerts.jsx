import { useState, useEffect, useMemo } from 'react';
import React from 'react';
import { Bell, Filter, Download, AlertTriangle, ArrowUp, ArrowDown, Eye } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RTooltip, ResponsiveContainer, Cell,
} from 'recharts';
import apiService from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import ModelContextBar from '../components/ModelContextBar';
import PageIntro from '../components/PageIntro';
import ChartCaption from '../components/ChartCaption';
import ExpandRowDetails from '../components/ExpandRowDetails';
import Tooltip, { TOOLTIPS } from '../components/Tooltip';
import { safeNum, riskBadge, severityColor, tickerFromFirmId } from '../utils/helpers';

const Alerts = () => {
  const [meta, setMeta] = useState(null);
  const [year, setYear] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterRisk, setFilterRisk] = useState('ALL');
  const [filterDir, setFilterDir] = useState('ALL');
  const [sortBy, setSortBy] = useState('abs_delta');
  const [sortDir, setSortDir] = useState('desc');

  useEffect(() => {
    apiService.getMeta().then((m) => {
      setMeta(m);
      const yrs = m.years || [];
      if (yrs.length) setYear(2024);
    }).catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!year) return;
    setLoading(true);
    apiService.getAlerts(year).then((d) => setData(d)).catch(() => setData(null)).finally(() => setLoading(false));
  }, [year]);

  const years = meta?.years || [];
  const alerts = data?.alerts || [];

  const filtered = useMemo(() => {
    let arr = [...alerts];
    if (filterRisk !== 'ALL') arr = arr.filter((a) => (a.label_t ?? a.label ?? '').toLowerCase() === filterRisk.toLowerCase());
    if (filterDir !== 'ALL') {
      arr = arr.filter((a) => {
        const delta = a.yoy_delta ?? a.delta ?? 0;
        return filterDir === 'UP' ? delta > 0 : delta < 0;
      });
    }
    arr.sort((a, b) => {
      const valA = sortBy === 'abs_delta' ? Math.abs(a.yoy_delta ?? a.delta ?? 0) : (a.profit_score ?? a.score ?? 0);
      const valB = sortBy === 'abs_delta' ? Math.abs(b.yoy_delta ?? b.delta ?? 0) : (b.profit_score ?? b.score ?? 0);
      return sortDir === 'desc' ? valB - valA : valA - valB;
    });
    return arr;
  }, [alerts, filterRisk, filterDir, sortBy, sortDir]);

  const severityDist = useMemo(() => {
    const map = {};
    alerts.forEach((a) => {
      const lbl = a.label_t ?? a.label ?? 'Unknown';
      map[lbl] = (map[lbl] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [alerts]);

  const barColor = (name) => {
    const n = name.toLowerCase();
    if (n.includes('high') || n.includes('very') || n.includes('critical')) return '#F43F5E';
    if (n.includes('medium') || n.includes('moderate') || n.includes('elevated')) return '#F59E0B';
    return '#10B981';
  };

  const downloadCSV = () => {
    const header = 'Mã,Score,Delta,Nhãn';
    const rows = filtered.map((a) => `${a.FIRM_ID || a.firm_id},${safeNum(a.profit_score ?? a.score, 3)},${safeNum(a.yoy_delta ?? a.delta, 3)},${a.label_t ?? a.label}`);
    const blob = new Blob([header + '\n' + rows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `alerts_${year}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const toggleSort = (col) => {
    if (sortBy === col) setSortDir(sortDir === 'desc' ? 'asc' : 'desc');
    else { setSortBy(col); setSortDir('desc'); }
  };

  const inputClasses = 'bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 sm:py-2 text-white text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition min-h-[40px]';
  const chartTooltipStyle = { background: 'rgba(26,32,53,0.95)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12 };

  if (loading) return <LoadingSpinner message="Đang tải cảnh báo..." />;

  return (
    <div className="space-y-4 sm:space-y-6">
      <ModelContextBar selectedYear={year} />
      <PageIntro
        text="Cảnh báo tự động phát hiện doanh nghiệp có biến động lớn (tăng hoặc giảm đáng kể) về điểm lợi nhuận so với năm trước."
        note="Nội dung trên ProfitPulse chỉ phục vụ phân tích và không phải khuyến nghị mua bán."
      />

      {/* Filters */}
      <section className="card p-4 sm:p-6">
        <div className="flex items-center gap-2 mb-3 sm:mb-4">
          <Filter className="h-5 w-5 text-primary-400" />
          <h2 className="text-base sm:text-lg font-display font-bold text-white">Bộ lọc</h2>
        </div>
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-end gap-3 sm:gap-4">
          <div>
            <label className="block label-xs mb-1.5">Năm</label>
            <select value={year || ''} onChange={(e) => setYear(Number(e.target.value))} className={inputClasses}>
              {years.map((y) => (<option key={y} value={y}>{y}</option>))}
            </select>
          </div>
          <div>
            <label className="block label-xs mb-1.5">Nhãn rủi ro</label>
            <select value={filterRisk} onChange={(e) => setFilterRisk(e.target.value)} className={inputClasses}>
              <option value="ALL">Tất cả</option>
              <option value="Very High Risk">Very High Risk</option>
              <option value="High Risk">High Risk</option>
              <option value="Medium Risk">Medium Risk</option>
              <option value="Low Risk">Low Risk</option>
            </select>
          </div>
          <div>
            <label className="block label-xs mb-1.5">Hướng</label>
            <select value={filterDir} onChange={(e) => setFilterDir(e.target.value)} className={inputClasses}>
              <option value="ALL">Tất cả</option>
              <option value="UP">Tăng</option>
              <option value="DOWN">Giảm</option>
            </select>
          </div>
          <button onClick={downloadCSV} className="btn-ghost text-sm col-span-2 sm:col-span-1"><Download className="h-4 w-4" /> Tải CSV</button>
        </div>
      </section>

      {/* Severity distribution */}
      {severityDist.length > 0 && (
        <section className="card card-hover p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-display font-bold text-white mb-1">Phân bổ mức độ</h3>
          <p className="text-xs sm:text-sm text-muted mb-3 sm:mb-4">Có bao nhiêu doanh nghiệp ở mỗi mức rủi ro.</p>
          <div className="chart-container">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={severityDist}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="name" tick={{ fill: '#94A3B8', fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fill: '#94A3B8', fontSize: 12 }} />
              <RTooltip contentStyle={chartTooltipStyle} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {severityDist.map((entry, idx) => (
                  <Cell key={idx} fill={barColor(entry.name)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          </div>
          <ChartCaption caption="Biểu đồ phân bổ mức độ cảnh báo theo nhãn rủi ro." />
        </section>
      )}

      {/* Alerts Table */}
      <section className="card overflow-hidden">
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-white/6 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base sm:text-lg font-display font-bold text-white">Danh sách cảnh báo</h3>
            <p className="text-xs sm:text-sm text-muted">{filtered.length} doanh nghiệp được gắn cờ</p>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <Bell className="h-12 w-12 text-muted mx-auto mb-3 opacity-50" />
            <p className="text-white font-medium mb-1">Không có cảnh báo</p>
            <p className="text-sm text-muted">Thử đổi bộ lọc để xem thêm doanh nghiệp.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs sm:text-sm min-w-[440px]">
              <thead className="bg-white/3 text-muted">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Mã</th>
                  <th className="px-4 py-3 text-right font-medium cursor-pointer select-none" onClick={() => toggleSort('score')}>
                    <Tooltip text={TOOLTIPS.profit_score}>Score</Tooltip> {sortBy === 'score' ? (sortDir === 'desc' ? '↓' : '↑') : ''}
                  </th>
                  <th className="px-4 py-3 text-right font-medium cursor-pointer select-none" onClick={() => toggleSort('abs_delta')}>
                    <Tooltip text="Biến động so với năm trước">Delta</Tooltip> {sortBy === 'abs_delta' ? (sortDir === 'desc' ? '↓' : '↑') : ''}
                  </th>
                  <th className="px-4 py-3 text-center font-medium"><Tooltip text={TOOLTIPS.label_risk}>Nhãn</Tooltip></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/6">
                {filtered.slice(0, 50).map((a, idx) => {
                  const delta = a.yoy_delta ?? a.delta ?? 0;
                  const badge = riskBadge(a.label_t ?? a.label);
                  const firmId = a.FIRM_ID || a.firm_id;
                  const ticker = tickerFromFirmId(firmId);
                  const alertYear = a.year || year;
                  
                  return (
                    <React.Fragment key={idx}>
                      <tr className="hover:bg-white/3 transition">
                        <td className="px-4 py-3 font-semibold text-white">{firmId}</td>
                        <td className="px-4 py-3 text-right font-mono text-white">{safeNum(a.profit_score ?? a.score, 3)}</td>
                        <td className="px-4 py-3 text-right">
                          <span className={`inline-flex items-center gap-1 font-mono ${delta > 0 ? 'text-emerald-400' : delta < 0 ? 'text-rose-400' : 'text-muted'}`}>
                            {delta > 0 ? <ArrowUp className="h-3.5 w-3.5" /> : delta < 0 ? <ArrowDown className="h-3.5 w-3.5" /> : null}
                            {safeNum(delta, 3)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${badge.className}`}>{badge.text}</span>
                        </td>
                      </tr>
                      <tr>
                        <td colSpan="4" className="p-0">
                          <ExpandRowDetails 
                            ticker={ticker}
                            year={alertYear}
                            severity={a.severity || 'medium'}
                          />
                        </td>
                      </tr>
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {filtered.length > 50 && (
          <div className="px-6 py-3 border-t border-white/6 text-center text-sm text-muted">
            Hiển thị 50 / {filtered.length} — tải CSV để xem tất cả.
          </div>
        )}
      </section>
    </div>
  );
};

export default Alerts;
