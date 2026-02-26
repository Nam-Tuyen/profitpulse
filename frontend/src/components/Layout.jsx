import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Search, TrendingUp, AlertTriangle, GitCompare, Menu, X, BarChart2, Info } from 'lucide-react';

const Layout = ({ children }) => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const navigation = [
    { name: 'Tổng quan', href: '/', icon: Home },
    { name: 'Sàng lọc', href: '/screener', icon: Search },
    { name: 'So sánh', href: '/compare', icon: GitCompare },
    { name: 'Cảnh báo', href: '/alerts', icon: AlertTriangle },
    { name: 'Về chúng tôi', href: '/about', icon: Info },
  ];
  
  const isActive = (path) => {
    return location.pathname === path;
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Modern Header with Glassmorphism */}
      <header className="sticky top-0 z-50 backdrop-blur-lg bg-white/80 border-b border-gray-200/50 shadow-sm">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-3 group">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl blur opacity-50 group-hover:opacity-75 transition"></div>
                <div className="relative bg-gradient-to-br from-blue-600 to-indigo-600 p-2 rounded-xl">
                  <BarChart2 className="h-6 w-6 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  ProfitPulse
                </h1>
                <p className="text-xs text-gray-500 hidden sm:block">Financial Insights</p>
              </div>
            </Link>
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      active
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-blue-600'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>
            
            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-gray-700 hover:bg-gray-100 transition"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
        
        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200/50 bg-white/95 backdrop-blur-lg">
            <nav className="px-4 py-4 space-y-2">
              {navigation.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium transition-all ${
                      active
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        )}
      </header>
      
      {/* Main Content - Full Width with Padding */}
      <main className="w-full min-h-[calc(100vh-4rem)] px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="max-w-[1920px] mx-auto">
          {children}
        </div>
      </main>
      
      {/* Modern Footer */}
      <footer className="bg-gradient-to-r from-gray-900 to-gray-800 text-white mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Brand */}
            <div>
              <div className="flex items-center space-x-2 mb-3">
                <BarChart2 className="h-6 w-6 text-blue-400" />
                <span className="text-lg font-bold">ProfitPulse</span>
              </div>
              <p className="text-gray-400 text-sm">
                Phân tích và dự báo lợi nhuận doanh nghiệp với công nghệ AI
              </p>
            </div>
            
            {/* Quick Links */}
            <div>
              <h3 className="font-semibold mb-3">Liên kết nhanh</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link to="/" className="hover:text-white transition">Tổng quan</Link></li>
                <li><Link to="/screener" className="hover:text-white transition">Sàng lọc</Link></li>
                <li><Link to="/about" className="hover:text-white transition">Về chúng tôi</Link></li>
              </ul>
            </div>
            
            {/* Copyright */}
            <div className="text-sm text-gray-400">
              <p className="mb-2">© 2024 ProfitPulse</p>
              <p>Dữ liệu được cập nhật định kỳ</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
