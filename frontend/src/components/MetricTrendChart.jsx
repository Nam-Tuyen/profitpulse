import { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, ResponsiveContainer, Legend } from 'recharts';
import { safeNum, formatVND } from '../utils/helpers';

/**
 * MetricTrendChart Component
 * Displays trend line for one selected financial metric over time
 */
const MetricTrendChart = ({ 
  data = [],
  defaultMetric = 'roa',
  showSelector = true,
  height = 300
}) => {
  const metrics = [
    { key: 'roa', label: 'ROA', color: '#6366F1', unit: '%', decimals: 2 },
    { key: 'roe', label: 'ROE', color: '#06B6D4', unit: '%', decimals: 2 },
    { key: 'roc', label: 'ROC', color: '#10B981', unit: '%', decimals: 2 },
    { key: 'eps', label: 'EPS', color: '#F59E0B', unit: 'VND', decimals: 0, isVND: true },
    { key: 'npm', label: 'NPM', color: '#F43F5E', unit: '%', decimals: 2 },
  ];

  const [selectedMetric, setSelectedMetric] = useState(defaultMetric);
  const currentMetric = metrics.find(m => m.key === selectedMetric) || metrics[0];

  // Prepare chart data
  const chartData = data
    .filter(d => d[selectedMetric] != null && !isNaN(d[selectedMetric]))
    .map(d => ({
      year: d.year,
      value: Number(d[selectedMetric]),
      label: currentMetric.isVND 
        ? formatVND(d[selectedMetric], currentMetric.decimals)
        : `${safeNum(d[selectedMetric], currentMetric.decimals)}${currentMetric.unit}`
    }))
    .sort((a, b) => a.year - b.year);

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted">
        <p>Không có dữ liệu xu hướng</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {showSelector && (
        <div className="flex flex-wrap gap-2">
          {metrics.map((m) => (
            <button
              key={m.key}
              onClick={() => setSelectedMetric(m.key)}
              className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition ${
                selectedMetric === m.key
                  ? 'bg-primary-600/20 text-primary-400 border border-primary-500/20'
                  : 'bg-white/5 text-muted hover:bg-white/10 hover:text-white border border-white/10'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      )}

      <div className="bg-surface-100 p-4 rounded-xl">
        <ResponsiveContainer width="100%" height={height}>
          <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={`gradient-${selectedMetric}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={currentMetric.color} stopOpacity={0.3} />
                <stop offset="95%" stopColor={currentMetric.color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis 
              dataKey="year" 
              stroke="#94a3b8" 
              style={{ fontSize: '12px' }}
              tick={{ fill: '#94a3b8' }}
            />
            <YAxis 
              stroke="#94a3b8" 
              style={{ fontSize: '12px' }}
              tick={{ fill: '#94a3b8' }}
              tickFormatter={(val) => currentMetric.isVND ? `${(val/1000).toFixed(0)}k` : safeNum(val, 1)}
            />
            <RTooltip
              contentStyle={{
                backgroundColor: 'rgba(15, 23, 42, 0.95)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                padding: '8px 12px',
              }}
              labelStyle={{ color: '#fff', fontWeight: 'bold' }}
              itemStyle={{ color: currentMetric.color }}
              formatter={(value) => [
                currentMetric.isVND 
                  ? formatVND(value, currentMetric.decimals)
                  : `${safeNum(value, currentMetric.decimals)}${currentMetric.unit}`,
                currentMetric.label
              ]}
            />
            <Legend 
              wrapperStyle={{ paddingTop: '10px' }}
              iconType="line"
            />
            <Line
              type="monotone"
              dataKey="value"
              name={currentMetric.label}
              stroke={currentMetric.color}
              strokeWidth={3}
              dot={{ fill: currentMetric.color, r: 4 }}
              activeDot={{ r: 6 }}
              fill={`url(#gradient-${selectedMetric})`}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="text-center">
        <p className="text-sm text-muted">
          Xu hướng <span className="text-white font-semibold">{currentMetric.label}</span> qua{' '}
          <span className="text-white font-semibold">{chartData.length}</span> năm
        </p>
      </div>
    </div>
  );
};

export default MetricTrendChart;
