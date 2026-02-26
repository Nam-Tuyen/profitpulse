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
    colorClasses = 'bg-green-100 text-green-800 border-green-200';
    label = 'Đủ dữ liệu';
  } else if (coverage >= 0.7 || missingFields.length <= 2) {
    status = 'partial';
    icon = <AlertCircle className="h-4 w-4" />;
    colorClasses = 'bg-yellow-100 text-yellow-800 border-yellow-200';
    label = `Thiếu ${missingFields.length > 0 ? 'một số chỉ tiêu' : `${totalYears - availableYears} năm`}`;
  } else {
    status = 'insufficient';
    icon = <XCircle className="h-4 w-4" />;
    colorClasses = 'bg-red-100 text-red-800 border-red-200';
    label = 'Thiếu nhiều dữ liệu';
  }
  
  return (
    <div className="inline-flex flex-col items-start">
      <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium border ${colorClasses}`}>
        {icon}
        <span>{label}</span>
      </div>
      
      {showDetails && (
        <div className="mt-1 text-xs text-gray-600">
          <div>Độ phủ: {availableYears}/{totalYears} năm ({(coverage * 100).toFixed(0)}%)</div>
          {missingFields.length > 0 && (
            <div className="text-orange-600">
              Thiếu: {missingFields.join(', ')}
            </div>
          )}
          {status === 'insufficient' && (
            <div className="text-red-600 mt-1">
              ⚠️ Độ tin cậy thấp
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DataCoverageBadge;
