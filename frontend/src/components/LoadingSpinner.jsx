import { Loader2 } from 'lucide-react';

const LoadingSpinner = ({ message = 'Đang tải...' }) => {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <Loader2 className="h-12 w-12 text-primary-600 animate-spin" />
      <p className="text-gray-600 mt-4">{message}</p>
    </div>
  );
};

export default LoadingSpinner;
