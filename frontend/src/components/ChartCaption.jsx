import { Info } from 'lucide-react';

/**
 * ChartCaption Component
 * Displays standardized chart annotations with title, subtitle, and detailed caption
 */
const ChartCaption = ({ title, subtitle, caption, purpose }) => {
  return (
    <div className="mt-3 pt-3 sm:mt-4 sm:pt-4 border-t border-white/6">
      {/* Title & Subtitle */}
      <div className="mb-2">
        {title && (
          <h4 className="text-sm font-semibold text-white">{title}</h4>
        )}
        {subtitle && (
          <p className="text-sm text-muted italic">{subtitle}</p>
        )}
      </div>
      
      {/* Main Caption */}
      {caption && (
        <div className="flex items-start space-x-2 bg-primary-600/8 border border-primary-500/10 p-2.5 sm:p-3 rounded-xl">
          <Info className="h-5 w-5 text-primary-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-slate-300 leading-relaxed">
              {caption}
            </p>
            {purpose && (
              <p className="text-xs text-muted mt-2 italic">
                <strong className="text-slate-300">Mục đích sử dụng:</strong> {purpose}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ChartCaption;
