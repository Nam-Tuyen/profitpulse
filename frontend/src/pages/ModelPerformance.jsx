import { useState, useEffect, useMemo } from 'react';
import { Activity, TrendingUp, BarChart3, Info, AlertTriangle } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RTooltip, ResponsiveContainer, Cell,
} from 'recharts';
import apiService from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import ModelContextBar from '../components/ModelContextBar';
import PageIntro from '../components/PageIntro';
import ChartCaption from '../components/ChartCaption';
import StatsCard from '../components/StatsCard';
import Tooltip, { TOOLTIPS } from '../components/Tooltip';
import { safeNum } from '../utils/helpers';

const ModelPerformance = () => {
  const [meta, setMeta] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([apiService.getMeta(), apiService.getModelMetrics().catch(() => null)])
      .then(([m, met]) => {
        setMeta(m);
        setMetrics(met);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const riskDistribution = useMemo(() => {
    if (!metrics?.risk_distribution) return [];
    return Object.entries(metrics.risk_distribution).map(([name, value]) => ({ name, value }));
  }, [metrics]);

  const barColor = (name) => {
    const n = name.toLowerCase();
    if (n.includes('very') || n.includes('critical')) return '#F43F5E';
    if (n.includes('high')) return '#FB923C';
    if (n.includes('medium') || n.includes('moderate')) return '#F59E0B';
    return '#10B981';
  };

  const kpis = metrics ? [
    { label: 'Variance Explained', value: `${safeNum((metrics.variance_explained ?? 0) * 100, 1)}%`, icon: 'chart-bar', color: 'purple' },
    { label: 'Tổng doanh nghiệp', value: metrics.total_companies ?? 'N/A', icon: 'building', color: 'cyan' },
    { label: 'Số năm', value: metrics.total_years ?? meta?.years?.length ?? 'N/A', icon: 'calendar', color: 'green' },
    { label: 'Số features', value: metrics.n_features ?? 'N/A', icon: 'layers', color: 'blue' },
  ] : [];

  const labelExplanations = [
    { label: 'Low Risk', range: 'Percentile > 75', desc: 'Chỉ số tài chính tốt nhất, rủi ro thấp.', color: 'text-emerald-400', bg: 'bg-emerald-500/15' },
    { label: 'Medium Risk', range: '50 < Percentile ≤ 75', desc: 'Trung bình, cần theo dõi thêm.', color: 'text-amber-400', bg: 'bg-amber-500/15' },
    { label: 'High Risk', range: '25 < Percentile ≤ 50', desc: 'Yếu hơn phần lớn thị trường, cần cẩn trọng.', color: 'text-orange-400', bg: 'bg-orange-500/15' },
    { label: 'Very High Risk', range: 'Percentile ≤ 25', desc: 'Rủi ro cao nhất, chỉ số tài chính yếu.', color: 'text-rose-400', bg: 'bg-rose-500/15' },
  ];

  const chartTooltipStyle = { background: 'rgba(26,32,53,0.95)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12 };

  if (loading) return <LoadingSpinner message="Đang tải model metrics..." />;

  return (
    <div className="space-y-4 sm:space-y-6">
      <ModelContextBar />
      <PageIntro
        text="Trang hiệu suất mô hình cho bạn cái nhìn tổng quan về PCA pipeline: variance explained, phân bổ nhãn, và cách diễn giải kết quả."
        note="Nội dung trên ProfitPulse chỉ phục vụ phân tích và không phải khuyến nghị mua bán."
      />

      {/* KPI Cards */}
      {kpis.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map((k, i) => (
            <StatsCard key={i} label={k.label} value={k.value} icon={k.icon} color={k.color} />
          ))}
        </div>
      )}

      {/* Model Metrics Table */}
      {metrics && (
        <section className="card overflow-hidden">
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-white/6">
            <h3 className="text-base sm:text-lg font-display font-bold text-white">Chi tiết Model Metrics</h3>
            <p className="text-xs sm:text-sm text-muted">Các thông số kỹ thuật từ PCA pipeline.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs sm:text-sm min-w-[360px]">
              <thead className="bg-white/3 text-muted">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Metric</th>
                  <th className="px-4 py-3 text-right font-medium">Giá trị</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/6">
                {[
                  ['Variance Explained (PC1–PC3)', `${safeNum((metrics.variance_explained ?? 0) * 100, 2)}%`],
                  ['PC1 Variance Ratio', safeNum(metrics.pc1_variance, 4)],
                  ['PC2 Variance Ratio', safeNum(metrics.pc2_variance, 4)],
                  ['PC3 Variance Ratio', safeNum(metrics.pc3_variance, 4)],
                  ['Tổng doanh nghiệp', metrics.total_companies ?? 'N/A'],
                  ['Số năm phân tích', metrics.total_years ?? 'N/A'],
                  ['Số features đầu vào', metrics.n_features ?? 'N/A'],
                ].map(([label, val], idx) => (
                  <tr key={idx} className="hover:bg-white/3 transition">
                    <td className="px-4 py-3 text-white">{label}</td>
                    <td className="px-4 py-3 text-right font-mono text-slate-300">{val}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Risk Distribution */}
      {riskDistribution.length > 0 && (
        <section className="card card-hover p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-display font-bold text-white mb-1">Phân bổ nhãn rủi ro</h3>
          <p className="text-xs sm:text-sm text-muted mb-3 sm:mb-4">Tỉ lệ doanh nghiệp ở mỗi mức rủi ro trong toàn bộ dataset.</p>
          <div className="chart-container">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={riskDistribution}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="name" tick={{ fill: '#94A3B8', fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fill: '#94A3B8', fontSize: 12 }} />
              <RTooltip contentStyle={chartTooltipStyle} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {riskDistribution.map((entry, idx) => (
                  <Cell key={idx} fill={barColor(entry.name)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          </div>
          <ChartCaption caption="Phân bổ theo nhãn rủi ro giúp bạn thấy thị trường nghiêng về nhóm nào." />
        </section>
      )}

      {/* Label Interpretation */}
      <section className="card p-4 sm:p-6">
        <div className="flex items-center gap-2 mb-3 sm:mb-4">
          <Info className="h-5 w-5 text-primary-400" />
          <h3 className="text-base sm:text-lg font-display font-bold text-white">Diễn giải nhãn rủi ro</h3>
        </div>
        <div className="grid sm:grid-cols-2 gap-2 sm:gap-3">
          {labelExplanations.map(({ label, range, desc, color, bg }, i) => (
            <div key={i} className={`${bg} rounded-xl p-3 sm:p-4 space-y-1`}>
              <span className={`text-sm font-semibold ${color}`}>{label}</span>
              <p className="text-xs text-muted">{range}</p>
              <p className="text-sm text-slate-300">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Missing Features Note */}
      {metrics?.missing_features && metrics.missing_features.length > 0 && (
        <section className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-400 mt-0.5 shrink-0" />
            <div>
              <h4 className="text-white font-semibold mb-1">Features thiếu trong dataset</h4>
              <p className="text-sm text-amber-200/80 mb-2">Một số features được pipeline yêu cầu nhưng không có trong dữ liệu. Kết quả có thể bị ảnh hưởng.</p>
              <div className="flex flex-wrap gap-2">
                {metrics.missing_features.map((f, i) => (
                  <span key={i} className="bg-amber-500/20 text-amber-400 text-xs px-2 py-0.5 rounded-full font-mono">{f}</span>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default ModelPerformance;
