import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Home, Search, AlertTriangle, GitCompare, Menu, X,
  Info, Activity, ChevronLeft, User,
} from 'lucide-react';

const Layout = ({ children }) => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  /* Close mobile sidebar on route change */
  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  /* Lock body scroll when mobile sidebar open */
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const navMain = [
    { name: 'Tổng quan', href: '/', icon: Home },
    { name: 'Sàng lọc', href: '/screener', icon: Search },
    { name: 'So sánh', href: '/compare', icon: GitCompare },
  ];

  const navInsights = [
    { name: 'Cảnh báo', href: '/alerts', icon: AlertTriangle },
    { name: 'Mô hình', href: '/performance', icon: Activity },
    { name: 'Giới thiệu', href: '/about', icon: Info },
  ];

  const allNav = [...navMain, ...navInsights];
  /* Bottom bar shows max 5 items on mobile */
  const bottomNav = [navMain[0], navMain[1], navInsights[0], navInsights[1], navInsights[2]];

  const isActive = (path) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  /* Sidebar nav item */
  const NavItem = ({ item, collapsed }) => {
    const Icon = item.icon;
    const active = isActive(item.href);
    return (
      <Link
        to={item.href}
        className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group
          ${active
            ? 'bg-primary-600/15 text-primary-400'
            : 'text-muted hover:text-white hover:bg-white/5'
          }`}
      >
        {active && (
          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-primary-500" />
        )}
        <Icon className={`h-[18px] w-[18px] flex-shrink-0 ${active ? 'text-primary-400' : 'text-muted group-hover:text-white'}`} />
        {!collapsed && <span>{item.name}</span>}
      </Link>
    );
  };

  /* Sidebar content (shared between desktop & mobile overlay) */
  const SidebarContent = ({ collapsed = false }) => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5">
        <div className="relative flex-shrink-0">
          <img src="/logo.svg" alt="logo" className="w-9 h-9 drop-shadow" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <h1 className="text-lg font-display font-extrabold text-white tracking-tight truncate">
              Profit <span className="bg-gradient-to-r from-primary-400 to-accent-400 bg-clip-text text-transparent">Pulse</span>
            </h1>
            <p className="text-[11px] text-muted truncate">Financial Insights</p>
          </div>
        )}
      </div>

      {/* Search placeholder */}
      {!collapsed && (
        <div className="px-3 mb-4">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/6 text-muted text-sm">
            <Search className="h-4 w-4" />
            <span>Tìm kiếm...</span>
          </div>
        </div>
      )}

      {/* Nav groups */}
      <nav className="flex-1 px-3 space-y-6 overflow-y-auto">
        <div>
          {!collapsed && <p className="label-xs px-3 mb-2">Chính</p>}
          <div className="space-y-1">
            {navMain.map((item) => (
              <NavItem key={item.href} item={item} collapsed={collapsed} />
            ))}
          </div>
        </div>
        <div>
          {!collapsed && <p className="label-xs px-3 mb-2">Phân tích</p>}
          <div className="space-y-1">
            {navInsights.map((item) => (
              <NavItem key={item.href} item={item} collapsed={collapsed} />
            ))}
          </div>
        </div>
      </nav>

      {/* User profile at bottom */}
      <div className="mt-auto border-t border-white/6 px-3 py-4">
        <div className={`flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}>
          <div className="w-8 h-8 rounded-full bg-primary-600/30 flex items-center justify-center flex-shrink-0">
            <User className="h-4 w-4 text-primary-400" />
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <p className="text-sm font-medium text-white truncate">Analyst</p>
              <p className="text-xs text-muted truncate">Free tier</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-surface">
      {/* ===== Desktop Sidebar (md+) ===== */}
      <aside
        className={`hidden md:flex flex-col fixed inset-y-0 left-0 z-40 border-r border-white/6 bg-surface-sidebar transition-all duration-300 ${
          sidebarOpen ? 'w-60' : 'w-[72px]'
        }`}
      >
        <SidebarContent collapsed={!sidebarOpen} />
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-surface-card border border-white/10 flex items-center justify-center text-muted hover:text-white transition"
        >
          <ChevronLeft className={`h-3.5 w-3.5 transition-transform ${!sidebarOpen ? 'rotate-180' : ''}`} />
        </button>
      </aside>

      {/* ===== Mobile Sidebar Overlay (< md) ===== */}
      {mobileOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/60 md:hidden" onClick={() => setMobileOpen(false)} />
          <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-surface-sidebar border-r border-white/6 md:hidden animate-slide-in-left">
            <div className="flex items-center justify-between px-4 pt-4">
              <span className="text-sm font-display font-bold text-white">Menu</span>
              <button onClick={() => setMobileOpen(false)} className="p-1.5 rounded-lg text-muted hover:text-white hover:bg-white/5 transition">
                <X className="h-5 w-5" />
              </button>
            </div>
            <SidebarContent />
          </aside>
        </>
      )}

      {/* ===== Main wrapper ===== */}
      <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${
        sidebarOpen ? 'md:ml-60' : 'md:ml-[72px]'
      }`}>
        {/* Mobile header bar — hamburger + logo (md and below only) */}
        <header className="md:hidden sticky top-0 z-30 h-14 flex items-center justify-between px-3 border-b border-white/6 bg-surface/90 backdrop-blur-lg">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="p-2 -ml-1 rounded-lg text-muted hover:text-white hover:bg-white/5 transition"
            >
              <Menu className="h-5 w-5" />
            </button>
            <Link to="/" className="flex items-center gap-2">
              <img src="/logo.svg" alt="logo" className="w-7 h-7 drop-shadow" />
              <span className="text-sm font-display font-bold text-white">Profit <span className="bg-gradient-to-r from-primary-400 to-accent-400 bg-clip-text text-transparent">Pulse</span></span>
            </Link>
          </div>
          <Link to="/screener" className="btn-primary text-xs py-1.5 px-3">
            <Search className="h-3.5 w-3.5" />
          </Link>
        </header>

        {/* Page content — bottom padding for mobile nav bar */}
        <main className="flex-1 p-3 sm:p-4 md:p-6 lg:p-8 pb-20 md:pb-6 lg:pb-8 overflow-x-hidden">
          {children}
        </main>
      </div>

      {/* ===== Mobile Bottom Navigation Bar (< md) ===== */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-surface-card/95 backdrop-blur-lg border-t border-white/6 safe-area-bottom">
        <div className="flex items-center justify-around h-14 px-1">
          {bottomNav.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                to={item.href}
                className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-1 rounded-lg transition-colors ${
                  active ? 'text-primary-400' : 'text-muted'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="text-[10px] font-medium leading-tight truncate max-w-[56px]">{item.name}</span>
                {active && <span className="w-4 h-0.5 rounded-full bg-primary-500 mt-0.5" />}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default Layout;
