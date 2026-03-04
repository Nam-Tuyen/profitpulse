import { AlertCircle, CheckCircle, XCircle } from 'lucide-react';

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
  
  // Determine status
  let status, icon, colorClasses, label;
  
  if (coverage >= 0.9 && missingFields.length === 0) {
    status = 'complete';
    icon = <CheckCircle className="h-4 w-4" />;
    colorClasses = 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20';
    label = 'Đủ dữ liệu';
  } else if (coverage >= 0.7 || missingFields.length <= 2) {
    status = 'partial';
    icon = <AlertCircle className="h-4 w-4" />;
    colorClasses = 'bg-amber-500/15 text-amber-400 border-amber-500/20';
    label = `Thiếu ${missingFields.length > 0 ? 'một số chỉ tiêu' : `${totalYears - availableYears} năm`}`;
  } else {
    status = 'insufficient';
    icon = <XCircle className="h-4 w-4" />;
    colorClasses = 'bg-rose-500/15 text-rose-400 border-rose-500/20';
    label = 'Thiếu nhiều dữ liệu';
  }
  
  return (
    <div className="inline-flex flex-col items-start">
      <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium border ${colorClasses}`}>
        {icon}
        <span>{label}</span>
      </div>
      
      {showDetails && (
        <div className="mt-1 text-xs text-muted">
          <div>Độ phủ: {availableYears}/{totalYears} năm ({(coverage * 100).toFixed(0)}%)</div>
          {missingFields.length > 0 && (
            <div className="text-amber-400">
              Thiếu: {missingFields.join(', ')}
            </div>
          )}
          {status === 'insufficient' && (
            <div className="text-rose-400 mt-1">
              ⚠️ Độ tin cậy thấp
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DataCoverageBadge;
