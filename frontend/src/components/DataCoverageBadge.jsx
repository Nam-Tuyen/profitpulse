import { CheckCircle, AlertCircle, XCircle } from 'lucide-react';

/**
 * DataCoverageBadge Component
 * Displays data quality/coverage status for transparency
 */
const DataCoverageBadge = ({ 
  availableYears, 
  totalYears, 
  missingFields = [],
  showDetails = false 
}) => {
  const coverage = availableYears / totalYears;
  
  let status, Icon, accent, bg, border, label;
  
  if (coverage >= 0.9 && missingFields.length === 0) {
    status = 'complete';
    Icon = CheckCircle;
    accent = 'text-emerald-400';
    bg    = 'bg-emerald-500/10';
    border = 'border-emerald-500/25';
    label = 'Đủ dữ liệu';
  } else if (coverage >= 0.7 || missingFields.length <= 2) {
    status = 'partial';
    Icon = AlertCircle;
    accent = 'text-amber-400';
    bg    = 'bg-amber-500/10';
    border = 'border-amber-500/25';
    label = `Thiếu ${missingFields.length > 0 ? 'một số chỉ tiêu' : `${totalYears - availableYears} năm`}`;
  } else {
    status = 'insufficient';
    Icon = XCircle;
    accent = 'text-rose-400';
    bg    = 'bg-rose-500/10';
    border = 'border-rose-500/25';
    label = 'Thiếu nhiều dữ liệu';
  }

  if (!showDetails) {
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${bg} ${accent} ${border}`}>
        <Icon className="h-3.5 w-3.5 flex-shrink-0" />
        {label}
      </span>
    );
  }

  const pct = Math.round(coverage * 100);
  const barColor = status === 'complete' ? 'bg-emerald-400' : status === 'partial' ? 'bg-amber-400' : 'bg-rose-400';

  return (
    <div className={`rounded-xl border ${border} ${bg} p-3 flex flex-col gap-2 w-full sm:max-w-xs`}>
      {/* Header */}
      <div className="flex items-center gap-2">
        <Icon className={`h-4 w-4 flex-shrink-0 ${accent}`} />
        <span className={`text-xs font-bold ${accent}`}>{label}</span>
      </div>

      {/* Progress bar */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] text-muted">Độ phủ chỉ số</span>
          <span className={`text-[10px] font-semibold ${accent}`}>{pct}%</span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
          <div className={`h-full rounded-full ${barColor} transition-all`} style={{ width: `${pct}%` }} />
        </div>
      </div>

      {/* Missing fields */}
      {missingFields.length > 0 && (
        <div className="text-[10px] text-muted leading-relaxed">
          <span className="text-amber-400 font-medium">Thiếu: </span>
          {missingFields.join(', ')}
        </div>
      )}

      {/* Warning */}
      {status === 'insufficient' && (
        <div className="text-[10px] text-rose-400 font-medium flex items-center gap-1">
          <span>⚠</span>
          <span>Độ tin cậy thấp, đọc kết quả cẩn thận</span>
        </div>
      )}
    </div>
  );
};

export default DataCoverageBadge;
