import { useState, useEffect } from 'react';
import { Info, ChevronDown, ChevronUp, Shield } from 'lucide-react';
import apiService from '../services/api';

/**
 * ModelContextBar — mandatory bar on every page.
 * Shows data range, current year, test window, label rule, models & disclaimer.
 */
const ModelContextBar = ({ selectedYear }) => {
  const [meta, setMeta] = useState(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    apiService.getMeta().then(setMeta).catch(() => {});
  }, []);

  const yearRange = meta?.year_range;
  const displayYear = selectedYear || (meta?.years?.length ? meta.years[meta.years.length - 1] : '—');

  return (
    <div className="card mb-4 sm:mb-6 text-sm overflow-hidden">
      {/* Collapsed row */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-3 py-2 sm:px-4 sm:py-2.5 hover:bg-white/5 transition gap-2"
      >
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap min-w-0">
          <Shield className="h-4 w-4 text-primary-400 flex-shrink-0" />
          <span className="font-medium text-white text-xs sm:text-sm">Ngữ cảnh</span>
          <span className="text-white/20 hidden sm:inline">|</span>
          <span className="text-muted hidden sm:inline">
            Data {yearRange ? `${yearRange.min}–${yearRange.max}` : '…'}
          </span>
          <span className="text-white/20 hidden sm:inline">|</span>
          <span className="text-primary-400 font-semibold text-xs sm:text-sm">Năm: {displayYear}</span>
          <span className="text-amber-400 text-[10px] sm:text-xs hidden md:inline">Không phải khuyến nghị mua bán</span>
        </div>
        {expanded ? <ChevronUp className="h-4 w-4 text-muted flex-shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted flex-shrink-0" />}
      </button>

      {/* Expanded details */}
      {expanded && (
        <div className="px-3 sm:px-4 pb-3 pt-1 border-t border-white/6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-1.5 text-[11px] sm:text-xs text-muted">
          <div><strong className="text-white">Data range:</strong> {yearRange ? `${yearRange.min} – ${yearRange.max}` : 'N/A'}</div>
          <div><strong className="text-white">Year đang xem:</strong> {displayYear}</div>
          <div><strong className="text-white">Test window:</strong> 2021–2024</div>
          <div><strong className="text-white">Label rule:</strong> Label_t = 1 nếu P_t {'>'} 0</div>
          <div><strong className="text-white">Models:</strong> XGBoost / SVM_RBF / RandomForest</div>
          <div className="sm:col-span-2 lg:col-span-1">
            <strong className="text-amber-400">Disclaimer:</strong> Nội dung trên ProfitPulse chỉ phục vụ phân tích và không phải khuyến nghị mua bán.
          </div>
        </div>
      )}
    </div>
  );
};

export default ModelContextBar;
