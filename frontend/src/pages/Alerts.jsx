import { useState, useEffect, useMemo } from 'react';
import { Bell, Filter, Download } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RTooltip, ResponsiveContainer, Cell,
} from 'recharts';
import apiService from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import PageIntro from '../components/PageIntro';
import ChartCaption from '../components/ChartCaption';

const ALERT_TYPE_LABELS = {
  risk_change: 'Rủi ro tăng',
  chance_drop: 'Điểm giảm mạnh',
  borderline: 'Vùng biên',
  roa_decline: 'ROA giảm liên tục',
  npm_decline: 'NPM giảm liên tục',
};

const SEVERITY_LABELS = {
  high: 'Cao',
  medium: 'Trung bình',
  low: 'Thấp',
};

const severityBadgeClass = (severity) => {
  switch ((severity || '').toLowerCase()) {
    case 'high': return 'bg-rose-500/20 text-rose-400 border border-rose-500/30';
    case 'medium': return 'bg-amber-500/20 text-amber-400 border border-amber-500/30';
    case 'low': return 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
    default: return 'bg-white/5 text-muted border border-white/10';
  }
};

const alertTypeColor = (type) => {
  switch (type) {
    case 'risk_change': return '#F43F5E';
    case 'chance_drop': return '#F59E0B';
    case 'borderline': return '#6366F1';
    case 'roa_decline': return '#F97316';
    case 'npm_decline': return '#EC4899';
    default: return '#94A3B8';
  }
};

const Alerts = () => {
  const [meta, setMeta] = useState(null);
  const [year, setYear] = useState(2024);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('ALL');
  const [filterSeverity, setFilterSeverity] = useState('ALL');
  const [sortBy, setSortBy] = useState('year');
  const [sortDir, setSortDir] = useState('desc');

  const selectClasses = 'w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2.5 sm:py-2 text-white text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition min-h-[40px]';
  const chartTooltipStyle = { background: 'rgba(26,32,53,0.95)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12 };

  useEffect(() => {
    apiService.getMeta().then((m) => setMeta(m)).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    apiService.getAlerts({
      year_from: year,
      year_to: year,
      rules: 'risk_change,chance_drop,borderline,roa_decline,npm_decline',
    })
      .then((d) => setData(d))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [year]);

  const years = meta?.years || [];
  const alerts = data?.alerts || [];

  const filtered = useMemo(() => {
    let arr = [...alerts];
    if (filterType !== 'ALL') arr = arr.filter((a) => a.alert_type === filterType);
    if (filterSeverity !== 'ALL') arr = arr.filter((a) => (a.severity || '').toLowerCase() === filterSeverity);
    arr.sort((a, b) => {
      let valA, valB;
      if (sortBy === 'year') { valA = a.year; valB = b.year; }
      else if (sortBy === 'severity') {
        const order = { high: 3, medium: 2, low: 1 };
        valA = order[(a.severity || '').toLowerCase()] || 0;
        valB = order[(b.severity || '').toLowerCase()] || 0;
      } else { valA = a.firm_id || ''; valB = b.firm_id || ''; }
      if (typeof valA === 'string') return sortDir === 'desc' ? valB.localeCompare(valA) : valA.localeCompare(valB);
      return sortDir === 'desc' ? valB - valA : valA - valB;
    });
    return arr;
  }, [alerts, filterType, filterSeverity, sortBy, sortDir]);

  const typeDist = useMemo(() => {
    const map = {};
    alerts.forEach((a) => {
      const key = a.alert_type || 'Unknown';
      map[key] = (map[key] || 0) + 1;
    });
    return Object.entries(map)
      .map(([name, value]) => ({ name, label: ALERT_TYPE_LABELS[name] || name, value }))
      .sort((a, b) => b.value - a.value);
  }, [alerts]);

  const toggleSort = (col) => {
    if (sortBy === col) setSortDir(sortDir === 'desc' ? 'asc' : 'desc');
    else { setSortBy(col); setSortDir('desc'); }
  };

  const downloadCSV = () => {
    const header = 'Năm,Mã DN,Loại cảnh báo,Thông điệp,Mức độ';
    const rows = filtered.map((a) =>
      `${a.year},${a.firm_id},${ALERT_TYPE_LABELS[a.alert_type] || a.alert_type},"${a.message}",${SEVERITY_LABELS[a.severity] || a.severity}`
    );
    const blob = new Blob([header + '\n' + rows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const el = document.createElement('a');
    el.href = url; el.download = `alerts_${year}.csv`; el.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <LoadingSpinner message="Đang tải cảnh báo..." />;

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageIntro
        text="Trang cảnh báo giúp bạn tự động phát hiện những doanh nghiệp có sự thay đổi đáng chú ý về điểm lợi nhuận so với năm trước để bạn ưu tiên kiểm tra sớm các trường hợp nổi bật."
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
            <select value={year} onChange={(e) => setYear(Number(e.target.value))} className={selectClasses}>
              {(years.length ? years : [2024]).map((y) => (<option key={y} value={y}>{y}</option>))}
            </select>
          </div>
          <div>
            <label className="block label-xs mb-1.5">Loại cảnh báo</label>
            <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className={selectClasses}>
              <option value="ALL">Tất cả</option>
              <option value="risk_change">Rủi ro tăng</option>
              <option value="chance_drop">Điểm giảm mạnh</option>
              <option value="borderline">Vùng biên</option>
              <option value="roa_decline">ROA giảm liên tục</option>
              <option value="npm_decline">NPM giảm liên tục</option>
            </select>
          </div>
          <div>
            <label className="block label-xs mb-1.5">Mức độ</label>
            <select value={filterSeverity} onChange={(e) => setFilterSeverity(e.target.value)} className={selectClasses}>
              <option value="ALL">Tất cả</option>
              <option value="high">Cao</option>
              <option value="medium">Trung bình</option>
              <option value="low">Thấp</option>
            </select>
          </div>
          <button
            onClick={() => { setFilterType(filterType); setFilterSeverity(filterSeverity); }}
            className="btn-primary text-sm col-span-2 sm:col-span-1 flex items-center gap-2 px-4 py-2 rounded-xl"
          >
            <Filter className="h-4 w-4" /> Lọc
          </button>
          <button onClick={downloadCSV} className="btn-ghost text-sm col-span-2 sm:col-span-1">
            <Download className="h-4 w-4" /> Tải CSV
          </button>
        </div>
      </section>

      {/* Distribution by alert type */}
      {typeDist.length > 0 && (
        <section className="card card-hover p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-display font-bold text-white mb-1">Phân bổ loại cảnh báo</h3>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={typeDist}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="label" tick={{ fill: '#94A3B8', fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fill: '#94A3B8', fontSize: 12 }} />
                <RTooltip
                  contentStyle={chartTooltipStyle}
                  formatter={(val, _, props) => [val + ' cảnh báo', props.payload.label]}
                  labelFormatter={(l) => l}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {typeDist.map((entry, idx) => (
                    <Cell key={idx} fill={alertTypeColor(entry.name)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <ChartCaption caption="Số lượng cảnh báo theo từng loại quy tắc phát hiện trong năm đã chọn." />
        </section>
      )}

      {/* Alerts Table */}
      <section className="card overflow-hidden">
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-white/6 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base sm:text-lg font-display font-bold text-white">Danh sách cảnh báo</h3>
            <p className="text-xs sm:text-sm text-muted">{filtered.length} cảnh báo được ghi nhận</p>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <Bell className="h-12 w-12 text-muted mx-auto mb-3 opacity-50" />
            <p className="text-white font-medium mb-1">Không có cảnh báo</p>
            <p className="text-sm text-muted">Thử đổi bộ lọc hoặc chọn năm khác.</p>
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[640px] overflow-y-auto">
            <table className="w-full text-xs sm:text-sm min-w-[560px]">
              <thead className="text-muted sticky top-0 z-10" style={{ backgroundColor: '#131929' }}>
                <tr>
                  <th className="px-4 py-3 text-left font-medium cursor-pointer select-none hover:text-white transition" onClick={() => toggleSort('year')}>
                    Năm {sortBy === 'year' ? (sortDir === 'desc' ? '↓' : '↑') : ''}
                  </th>
                  <th className="px-4 py-3 text-left font-medium cursor-pointer select-none hover:text-white transition" onClick={() => toggleSort('firm')}>
                    Mã DN {sortBy === 'firm' ? (sortDir === 'desc' ? '↓' : '↑') : ''}
                  </th>
                  <th className="px-4 py-3 text-left font-medium">Loại cảnh báo</th>
                  <th className="px-4 py-3 text-left font-medium">Thông điệp</th>
                  <th className="px-4 py-3 text-center font-medium cursor-pointer select-none hover:text-white transition" onClick={() => toggleSort('severity')}>
                    Mức độ {sortBy === 'severity' ? (sortDir === 'desc' ? '↓' : '↑') : ''}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/6">
                {filtered.slice(0, 100).map((a, idx) => (
                  <tr key={idx} className="hover:bg-white/3 transition">
                    <td className="px-4 py-3 font-semibold text-white">{a.year}</td>
                    <td className="px-4 py-3 font-semibold text-primary-400">{a.firm_id}</td>
                    <td className="px-4 py-3">
                      <span
                        className="px-2 py-0.5 rounded-full text-xs font-medium border"
                        style={{
                          color: alertTypeColor(a.alert_type),
                          borderColor: alertTypeColor(a.alert_type) + '50',
                          backgroundColor: alertTypeColor(a.alert_type) + '18',
                        }}
                      >
                        {ALERT_TYPE_LABELS[a.alert_type] || a.alert_type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-300 max-w-xs truncate" title={a.message}>{a.message}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${severityBadgeClass(a.severity)}`}>
                        {SEVERITY_LABELS[a.severity] || a.severity}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {filtered.length > 100 && (
          <div className="px-6 py-3 border-t border-white/6 text-center text-sm text-muted">
            Hiển thị 100 / {filtered.length} — tải CSV để xem tất cả.
          </div>
        )}
      </section>
    </div>
  );
};

export default Alerts;
