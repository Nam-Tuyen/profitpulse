/**
 * Error Boundary for handling API and runtime errors
 */
import { Component } from 'react';
import { AlertTriangle } from 'lucide-react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-surface p-4">
          <div className="max-w-md w-full card p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-rose-500/15 rounded-full mb-4">
              <AlertTriangle className="h-8 w-8 text-rose-400" />
            </div>
            <h2 className="text-2xl font-display font-bold text-white mb-2">Oops! Có lỗi xảy ra</h2>
            <p className="text-muted mb-6">
              Đã xảy ra lỗi không mong muốn. Vui lòng tải lại trang.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="w-full btn-primary py-3"
            >
              Tải lại trang
            </button>
            {this.props.showError && (
              <details className="mt-4 text-left">
                <summary className="text-sm text-muted cursor-pointer hover:text-white">
                  Chi tiết lỗi (dành cho developer)
                </summary>
                <pre className="mt-2 p-3 bg-surface-200 rounded-lg text-xs text-rose-400 overflow-auto">
                  {this.state.error?.toString()}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
