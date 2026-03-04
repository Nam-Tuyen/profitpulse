import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, TrendingUp, TrendingDown, Loader2 } from 'lucide-react';
import apiService from '../services/api';
import { safeNum } from '../utils/helpers';

/**
 * ExpandRowDetails Component
 * Lazy loads company data to calculate YoY deltas for alerts
 */
const ExpandRowDetails = ({ ticker, year, severity }) => {
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [details, setDetails] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!expanded || details) return;
    
    setLoading(true);
    setError(null);
    
    apiService.getCompany(ticker)
      .then((data) => {
        const timeseries = data?.timeseries || [];
        const currentYear = timeseries.find(t => t.year === year);
        const previousYear = timeseries.find(t => t.year === year - 1);
        
        if (!currentYear) {
          setError('Không tìm thấy dữ liệu cho năm này');
          return;
        }
        
        const deltaScore = (
          currentYear.profitscore != null && previousYear?.profitscore != null
        ) ? currentYear.profitscore - previousYear.profitscore : null;
        
        const deltaPercentile = (
          currentYear.percentile != null && previousYear?.percentile != null
        ) ? currentYear.percentile - previousYear.percentile : null;
        
        const riskFlip = (
          currentYear.label != null && previousYear?.label != null && currentYear.label !== previousYear.label
        );
        
        setDetails({
          currentScore: currentYear.profitscore,
          previousScore: previousYear?.profitscore,
          deltaScore,
          currentPercentile: currentYear.percentile,
          previousPercentile: previousYear?.percentile,
          deltaPercentile,
          riskFlip,
          currentLabel: currentYear.label,
          previousLabel: previousYear?.label,
        });
      })
      .catch((err) => {
        console.error(err);
        setError('Không thể tải chi tiết');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [expanded, ticker, year, details]);

  const renderDelta = (delta, label) => {
    if (delta == null) return <span className="text-muted">N/A</span>;
    
    const isPositive = delta > 0;
    const isNeutral = Math.abs(delta) < 0.01;
    
    if (isNeutral) {
      return (
        <div className="flex items-center gap-1 text-muted text-sm">
          <span>~0 {label}</span>
        </div>
      );
    }
    
    return (
      <div className={`flex items-center gap-1 text-sm font-medium ${
        isPositive ? 'text-emerald-400' : 'text-rose-400'
      }`}>
        {isPositive ? (
          <TrendingUp className="h-4 w-4" />
        ) : (
          <TrendingDown className="h-4 w-4" />
        )}
        <span>
          {isPositive ? '+' : ''}{safeNum(delta, 2)} {label}
        </span>
      </div>
    );
  };

  return (
    <div className="border-t border-white/10 mt-2">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-2 text-sm text-primary-400 hover:bg-white/5 transition"
      >
        <span className="font-medium">
          {expanded ? 'Ẩn chi tiết' : 'Xem chi tiết YoY'}
        </span>
        {expanded ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
      </button>
      
      {expanded && (
        <div className="px-4 pb-3 pt-1">
          {loading && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-5 w-5 text-primary-400 animate-spin" />
              <span className="ml-2 text-muted text-sm">Đang tải...</span>
            </div>
          )}
          
          {error && (
            <div className="text-rose-400 text-sm py-2">
              {error}
            </div>
          )}
          
          {details && !loading && (
            <div className="bg-surface-100 p-3 rounded-lg space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted mb-1">Profit Score</p>
                  <div className="flex items-center justify-between">
                    <div className="text-sm">
                      <span className="text-muted">{year - 1}: </span>
                      <span className="text-white font-semibold">
                        {details.previousScore != null ? safeNum(details.previousScore, 2) : 'N/A'}
                      </span>
                    </div>
                    <span className="text-muted">→</span>
                    <div className="text-sm">
                      <span className="text-muted">{year}: </span>
                      <span className="text-white font-semibold">
                        {details.currentScore != null ? safeNum(details.currentScore, 2) : 'N/A'}
                      </span>
                    </div>
                  </div>
                  <div className="mt-1">
                    {renderDelta(details.deltaScore, 'điểm')}
                  </div>
                </div>
                
                <div>
                  <p className="text-xs text-muted mb-1">Percentile</p>
                  <div className="flex items-center justify-between">
                    <div className="text-sm">
                      <span className="text-muted">{year - 1}: </span>
                      <span className="text-white font-semibold">
                        {details.previousPercentile != null ? safeNum(details.previousPercentile, 1) : 'N/A'}
                      </span>
                    </div>
                    <span className="text-muted">→</span>
                    <div className="text-sm">
                      <span className="text-muted">{year}: </span>
                      <span className="text-white font-semibold">
                        {details.currentPercentile != null ? safeNum(details.currentPercentile, 1) : 'N/A'}
                      </span>
                    </div>
                  </div>
                  <div className="mt-1">
                    {renderDelta(details.deltaPercentile, '%')}
                  </div>
                </div>
              </div>
              
              {details.riskFlip && (
                <div className="pt-2 border-t border-white/5">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted">Nhãn rủi ro thay đổi:</span>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      details.previousLabel === 0 || details.previousLabel === '0' 
                        ? 'bg-emerald-500/15 text-emerald-400' 
                        : 'bg-rose-500/15 text-rose-400'
                    }`}>
                      {details.previousLabel === 0 || details.previousLabel === '0' ? 'Thấp' : 'Cao'}
                    </span>
                    <span className="text-muted">→</span>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      details.currentLabel === 0 || details.currentLabel === '0' 
                        ? 'bg-emerald-500/15 text-emerald-400' 
                        : 'bg-rose-500/15 text-rose-400'
                    }`}>
                      {details.currentLabel === 0 || details.currentLabel === '0' ? 'Thấp' : 'Cao'}
                    </span>
                  </div>
                </div>
              )}
              
              <div className="pt-2 border-t border-white/5">
                <p className="text-xs text-muted italic">
                  Chi tiết cảnh báo cho bạn thấy điểm và phân vị thay đổi bao nhiêu so với năm trước để ưu tiên kiểm tra.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ExpandRowDetails;
