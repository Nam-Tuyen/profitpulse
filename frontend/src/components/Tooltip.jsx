import { HelpCircle } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

/**
 * Tooltip component for field explanations.
 * Hover/click to show a small popover.
 */
const Tooltip = ({ text, children }) => {
  const [show, setShow] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setShow(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <span className="relative inline-flex items-center" ref={ref}>
      {children}
      <button
        onClick={() => setShow(!show)}
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        className="ml-1 text-muted hover:text-primary-400 transition"
        aria-label="Xem giải thích"
      >
        <HelpCircle className="h-3.5 w-3.5" />
      </button>
      {show && (
        <span className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 px-3 py-2 rounded-xl text-xs leading-relaxed shadow-lg pointer-events-none backdrop-blur-xl" style={{ background: 'rgba(26,32,53,0.92)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <span className="text-slate-200">{text}</span>
          <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent" style={{ borderTopColor: 'rgba(26,32,53,0.92)' }} />
        </span>
      )}
    </span>
  );
};

/* Pre-built tooltips for key metrics */
export const TOOLTIPS = {
  profit_score: 'Điểm lợi nhuận là điểm tổng hợp để so doanh nghiệp trong cùng một năm.',
  percentile: 'Phân vị cho biết doanh nghiệp đứng ở đâu so với toàn thị trường trong năm đó.',
  label_risk: 'Nhãn rủi ro là cảnh báo theo quy tắc hệ thống và không phải khuyến nghị mua bán.',
  missing: 'Thiếu dữ liệu do firm-year không đủ 5 proxy.',
};

export default Tooltip;
