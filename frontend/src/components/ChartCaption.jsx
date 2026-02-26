import { Info } from 'lucide-react';

/**
 * ChartCaption Component
 * Displays standardized chart annotations with title, subtitle, and detailed caption
 */
const ChartCaption = ({ title, subtitle, caption, purpose }) => {
  return (
    <div className="mt-4 pt-4 border-t border-gray-200">
      {/* Title & Subtitle */}
      <div className="mb-2">
        {title && (
          <h4 className="text-sm font-semibold text-gray-900">{title}</h4>
        )}
        {subtitle && (
          <p className="text-sm text-gray-600 italic">{subtitle}</p>
        )}
      </div>
      
      {/* Main Caption */}
      {caption && (
        <div className="flex items-start space-x-2 bg-blue-50 p-3 rounded-lg">
          <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-gray-700 leading-relaxed">
              {caption}
            </p>
            {purpose && (
              <p className="text-xs text-gray-600 mt-2 italic">
                <strong>Mục đích sử dụng:</strong> {purpose}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ChartCaption;
