import { useEffect, useState } from 'react';

const DOTS = ['🥔', '🫧', '♨️', '🍲'];

const LoadingSpinner = ({ message = 'Đang tải...' }) => {
  const [progress, setProgress] = useState(0);
  const [dotIdx, setDotIdx] = useState(0);
  const [bounce, setBounce] = useState(false);

  useEffect(() => {
    const steps = [
      { target: 20, duration: 250 },
      { target: 40, duration: 400 },
      { target: 58, duration: 500 },
      { target: 70, duration: 600 },
      { target: 80, duration: 800 },
      { target: 88, duration: 1000 },
      { target: 92, duration: 1400 },
    ];
    const timers = [];
    let elapsed = 0;
    steps.forEach(({ target, duration }) => {
      elapsed += duration;
      timers.push(setTimeout(() => setProgress(target), elapsed));
    });
    return () => timers.forEach(clearTimeout);
  }, []);

  // Cycle emoji every 700ms
  useEffect(() => {
    const id = setInterval(() => {
      setDotIdx((i) => (i + 1) % DOTS.length);
      setBounce(true);
      setTimeout(() => setBounce(false), 300);
    }, 700);
    return () => clearInterval(id);
  }, []);

  // Bubbles
  const bubbles = [
    { size: 6, left: '12%', delay: '0s', dur: '1.8s' },
    { size: 4, left: '28%', delay: '0.4s', dur: '2.2s' },
    { size: 8, left: '50%', delay: '0.2s', dur: '1.6s' },
    { size: 5, left: '68%', delay: '0.7s', dur: '2.0s' },
    { size: 3, left: '82%', delay: '0.1s', dur: '1.5s' },
  ];

  return (
    <div className="flex flex-col items-center justify-center py-16 sm:py-24 px-4 w-full">
      {/* Pot illustration */}
      <div className="relative mb-6 select-none">
        {/* Steam / bubbles rising */}
        <div className="absolute -top-8 left-0 right-0 flex justify-around pointer-events-none" style={{ height: 32 }}>
          {bubbles.map((b, i) => (
            <span
              key={i}
              className="absolute rounded-full bg-primary-400/30"
              style={{
                width: b.size, height: b.size,
                left: b.left,
                bottom: 0,
                animation: `bubbleRise ${b.dur} ${b.delay} ease-in infinite`,
              }}
            />
          ))}
        </div>

        {/* Emoji */}
        <div
          className="text-5xl sm:text-6xl transition-transform duration-300"
          style={{ transform: bounce ? 'scale(1.25) translateY(-4px)' : 'scale(1) translateY(0)' }}
        >
          {DOTS[dotIdx]}
        </div>
      </div>

      <div className="w-full max-w-xs sm:max-w-sm">
        {/* Message */}
        <p className="text-center text-sm sm:text-base font-medium text-white mb-1">
          {message}
        </p>
        <p className="text-center text-xs text-muted mb-5">Hệ thống đang xử lý dữ liệu…</p>

        {/* Progress bar */}
        <div className="h-2 w-full bg-white/8 rounded-full overflow-hidden mb-2">
          <div
            className="h-full rounded-full bg-gradient-to-r from-amber-500 via-primary-500 to-accent-400"
            style={{ width: `${progress}%`, transition: 'width 700ms ease-out' }}
          />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-muted">
            {progress < 40 ? 'Đang đun nước…' : progress < 70 ? 'Khoai đang chín…' : progress < 90 ? 'Gần nhừ rồi…' : 'Sắp xong!'}
          </span>
          <span className="text-primary-400 text-[10px] font-mono font-semibold">{progress}%</span>
        </div>
      </div>

      <style>{`
        @keyframes bubbleRise {
          0%   { opacity: 0; transform: translateY(0) scale(0.6); }
          20%  { opacity: 0.7; }
          100% { opacity: 0; transform: translateY(-36px) scale(1.2); }
        }
      `}</style>
    </div>
  );
};

export default LoadingSpinner;
