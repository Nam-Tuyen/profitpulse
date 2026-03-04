import { MoreVertical } from 'lucide-react';

const StatsCard = ({ title, value, subtitle, icon: Icon, color = 'purple', change, changeDir }) => {
  const iconColorMap = {
    purple: 'bg-primary-600/20 text-primary-400',
    cyan: 'bg-accent-500/20 text-accent-400',
    green: 'bg-emerald-500/20 text-emerald-400',
    red: 'bg-rose-500/20 text-rose-400',
    blue: 'bg-primary-600/20 text-primary-400',
    yellow: 'bg-amber-500/20 text-amber-400',
  };

  return (
    <div className="card card-hover p-4 sm:p-5">
      <div className="flex items-start justify-between mb-2 sm:mb-3">
        <div className="flex items-center gap-2 min-w-0">
          {Icon && (
            <div className={`p-1.5 sm:p-2 rounded-lg sm:rounded-xl flex-shrink-0 ${iconColorMap[color] || iconColorMap.purple}`}>
              <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </div>
          )}
          <span className="label-xs truncate">{title}</span>
        </div>
        <button className="text-muted hover:text-white transition p-1 flex-shrink-0 hidden sm:block" aria-label="more">
          <MoreVertical className="h-4 w-4" />
        </button>
      </div>
      <p className="metric mb-1">{value}</p>
      <div className="flex items-center gap-2 flex-wrap">
        {change != null && (
          <span className={changeDir === 'up' ? 'pill-up' : changeDir === 'down' ? 'pill-down' : 'pill-neutral'}>
            {changeDir === 'up' ? '+' : ''}{change}
          </span>
        )}
        {subtitle && <span className="text-[11px] sm:text-xs text-muted truncate">{subtitle}</span>}
      </div>
    </div>
  );
};

export default StatsCard;
