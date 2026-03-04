import { Loader2 } from 'lucide-react';

const LoadingSpinner = ({ message = 'Đang tải...' }) => {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="relative">
        <div className="absolute inset-0 rounded-full blur-lg bg-primary-500/20" />
        <Loader2 className="h-10 w-10 text-primary-400 animate-spin relative" />
      </div>
      <p className="text-muted text-sm mt-5 font-body">{message}</p>
    </div>
  );
};

export default LoadingSpinner;
