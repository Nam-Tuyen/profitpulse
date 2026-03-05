import { useEffect, useState } from 'react';

const LoadingSpinner = ({ message = 'Đang tải...' }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Quick rise to 70%, then slow crawl to 92%
    const steps = [
      { target: 30, duration: 200 },
      { target: 55, duration: 300 },
      { target: 70, duration: 400 },
      { target: 80, duration: 600 },
      { target: 88, duration: 800 },
      { target: 92, duration: 1200 },
    ];

    let current = 0;
    const timers = [];
    let elapsed = 0;

    steps.forEach(({ target, duration }) => {
      elapsed += duration;
      const t = setTimeout(() => {
        setProgress(target);
        current = target;
      }, elapsed);
      timers.push(t);
    });

    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 w-full">
      <div className="w-full max-w-xs sm:max-w-sm">
        {/* Progress bar track */}
        <div className="h-1.5 w-full bg-white/8 rounded-full overflow-hidden mb-4">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary-500 to-accent-400 transition-all"
            style={{ width: `${progress}%`, transitionDuration: '600ms', transitionTimingFunction: 'ease-out' }}
          />
        </div>
        <div className="flex items-center justify-between">
          <p className="text-muted text-xs sm:text-sm">{message}</p>
          <span className="text-primary-400 text-xs font-mono font-semibold">{progress}%</span>
        </div>
      </div>
    </div>
  );
};

export default LoadingSpinner;
