import { TrendingUp, TrendingDown, Minus, Info } from 'lucide-react';
import Tooltip from './Tooltip';
import { safeNum, formatVND, getFinancialBadge, METRIC_TOOLTIPS } from '../utils/helpers';

/**
 * FinancialMetricsTable Component
 * Displays ROA, ROE, ROC, EPS, NPM for selected year with YoY change
 */
const FinancialMetricsTable = ({ 
  currentYear, 
  previousYear = null,
  showBadges = false,
  showYoY = true,
  compact = false
}) => {
  const metrics = [
    { key: 'roa', label: 'ROA', unit: '%', decimals: 2 },
    { key: 'roe', label: 'ROE', unit: '%', decimals: 2 },
    { key: 'roc', label: 'ROC', unit: '%', decimals: 2 },
    { key: 'eps', label: 'EPS', unit: 'VND', decimals: 0, isVND: true },
    { key: 'npm', label: 'NPM', unit: '%', decimals: 2 },
  ];

  const getYoYChange = (current, previous, key) => {
    if (!current || !previous) return null;
    const curVal = current[key];
    const prevVal = previous[key];
    if (curVal == null || prevVal == null || isNaN(curVal) || isNaN(prevVal)) return null;
    return curVal - prevVal;
  };

  const renderYoYIndicator = (change) => {
    if (change == null) return <span className="text-muted text-xs">N/A</span>;
    
    const isPositive = change > 0;
    const isNeutral = Math.abs(change) < 0.01;
    
    if (isNeutral) {
      return (
        <div className="flex items-center gap-1 text-muted text-xs">
          <Minus className="h-3 w-3" />
          <span>~0</span>
        </div>
      );
    }
    
    return (
      <div className={`flex items-center gap-1 text-xs font-medium ${
        isPositive ? 'text-emerald-400' : 'text-rose-400'
      }`}>
        {isPositive ? (
          <TrendingUp className="h-3 w-3" />
        ) : (
          <TrendingDown className="h-3 w-3" />
        )}
        <span>{isPositive ? '+' : ''}{safeNum(change, 2)}</span>
      </div>
    );
  };

  if (compact) {
    return (
      <div className="overflow-x-auto hide-scrollbar">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10">
              <th className="px-3 py-2 text-left text-xs font-semibold text-muted uppercase tracking-wider">
                Chỉ số
              </th>
              <th className="px-3 py-2 text-right text-xs font-semibold text-muted uppercase tracking-wider">
                Giá trị
              </th>
              {showYoY && previousYear && (
                <th className="px-3 py-2 text-right text-xs font-semibold text-muted uppercase tracking-wider">
                  YoY
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {metrics.map((m) => {
              const value = currentYear?.[m.key];
              const yoyChange = showYoY && previousYear ? getYoYChange(currentYear, previousYear, m.key) : null;
              
              return (
                <tr key={m.key} className="hover:bg-white/5 transition">
                  <td className="px-3 py-2 text-white font-medium">
                    {m.label}
                  </td>
                  <td className="px-3 py-2 text-right text-white">
                    {value != null && !isNaN(value)
                      ? m.isVND
                        ? formatVND(value, m.decimals)
                        : `${safeNum(value, m.decimals)}${m.unit}`
                      : 'N/A'}
                  </td>
                  {showYoY && previousYear && (
                    <td className="px-3 py-2 text-right">
                      {renderYoYIndicator(yoyChange)}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto hide-scrollbar">
      <table className="w-full">
        <thead>
          <tr className="border-b border-white/10">
            <th className="px-4 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">
              Chỉ số
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">
              Mô tả
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-muted uppercase tracking-wider">
              Giá trị {currentYear?.year || ''}
            </th>
            {showYoY && previousYear && (
              <th className="px-4 py-3 text-right text-xs font-semibold text-muted uppercase tracking-wider">
                YoY Change
              </th>
            )}
            {showBadges && (
              <th className="px-4 py-3 text-center text-xs font-semibold text-muted uppercase tracking-wider">
                Đánh giá
              </th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {metrics.map((m) => {
            const value = currentYear?.[m.key];
            const yoyChange = showYoY && previousYear ? getYoYChange(currentYear, previousYear, m.key) : null;
            const badge = showBadges && !m.isVND ? getFinancialBadge(m.key, value) : null;
            
            return (
              <tr key={m.key} className="hover:bg-white/5 transition">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-semibold">{m.label}</span>
                    <Tooltip content={METRIC_TOOLTIPS[m.key]} className="cursor-help">
                      <Info className="h-4 w-4 text-muted hover:text-primary-400 transition" />
                    </Tooltip>
                  </div>
                </td>
                <td className="px-4 py-3 text-muted text-sm max-w-xs">
                  {METRIC_TOOLTIPS[m.key]?.split('và')[0] || ''}
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="text-white font-semibold text-base">
                    {value != null && !isNaN(value)
                      ? m.isVND
                        ? formatVND(value, m.decimals)
                        : `${safeNum(value, m.decimals)}${m.unit}`
                      : 'N/A'}
                  </span>
                </td>
                {showYoY && previousYear && (
                  <td className="px-4 py-3 text-right">
                    {renderYoYIndicator(yoyChange)}
                  </td>
                )}
                {showBadges && (
                  <td className="px-4 py-3 text-center">
                    {badge && !m.isVND ? (
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${badge.className}`}>
                        {badge.text}
                      </span>
                    ) : (
                      <span className="text-muted text-xs">—</span>
                    )}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default FinancialMetricsTable;
