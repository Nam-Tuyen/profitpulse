import { Info } from 'lucide-react';

/**
 * PageIntro — renders a small info box below the page header.
 * Props:
 *   text  – main description sentence
 *   note  – optional secondary note (e.g. disclaimer)
 */
const PageIntro = ({ text, note }) => {
  if (!text) return null;
  return (
    <div className="flex items-start gap-2 sm:gap-2.5 bg-primary-600/8 border border-primary-500/15 rounded-xl px-3 py-2.5 sm:px-4 sm:py-3 mb-4 sm:mb-6 text-xs sm:text-sm">
      <Info className="h-5 w-5 text-primary-400 flex-shrink-0 mt-0.5" />
      <div>
        <p className="text-slate-300 leading-relaxed">{text}</p>
        {note && <p className="text-muted text-xs mt-1 italic">{note}</p>}
      </div>
    </div>
  );
};

export default PageIntro;
