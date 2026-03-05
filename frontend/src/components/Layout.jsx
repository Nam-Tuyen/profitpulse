import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Home, Search, GitCompare, Menu, X,
  Info, Activity,
} from 'lucide-react';

const NAV_LINKS = [
  { name: 'Tổng quan', href: '/', icon: Home },
  { name: 'Sàng lọc', href: '/screener', icon: Search },
  { name: 'So sánh', href: '/compare', icon: GitCompare },
  { name: 'Mô hình', href: '/performance', icon: Activity },
  { name: 'Giới thiệu', href: '/about', icon: Info },
];

const Layout = ({ children }) => {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const drawerRef = useRef(null);

  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  useEffect(() => {
    if (!mobileOpen) return;
    const handler = (e) => {
      if (drawerRef.current && !drawerRef.current.contains(e.target)) {
        setMobileOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [mobileOpen]);

  const isActive = (path) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  return (
    <div style={{ width: '100%', minHeight: '100vh', display: 'flex', flexDirection: 'column' }} className="bg-surface">

      {/* TOP NAVIGATION BAR */}
      <header className="sticky top-0 z-50 border-b border-white/6 backdrop-blur-lg" style={{ width: '100%', backgroundColor: 'rgba(13,17,23,0.92)' }}>
        <div className="mx-auto w-full px-4 sm:px-6 lg:px-10 xl:px-16" style={{ maxWidth: '1400px' }}>
          <div className="flex items-center justify-between h-14 sm:h-16">

            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5 flex-shrink-0">
              <img src="/logo.svg" alt="ProfitPulse" className="w-7 h-7 sm:w-8 sm:h-8 drop-shadow" />
              <span className="text-base sm:text-lg font-display font-extrabold text-white tracking-tight">
                Profit <span className="bg-gradient-to-r from-primary-400 to-accent-400 bg-clip-text text-transparent">Pulse</span>
              </span>
            </Link>

            {/* Desktop nav links */}
            <nav className="hidden md:flex items-center gap-1">
              {NAV_LINKS.map(({ name, href, icon: Icon }) => {
                const active = isActive(href);
                return (
                  <Link
                    key={href}
                    to={href}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-150
                      ${active
                        ? 'bg-primary-600/15 text-primary-400'
                        : 'text-muted hover:text-white hover:bg-white/5'
                      }`}
                  >
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    {name}
                  </Link>
                );
              })}
            </nav>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen((o) => !o)}
              className="md:hidden p-2 rounded-xl text-muted hover:text-white hover:bg-white/5 transition"
              aria-label="Menu"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
        {mobileOpen && (
          <>
            <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={() => setMobileOpen(false)} />
            <div
              ref={drawerRef}
              className="absolute top-full left-0 right-0 z-50 md:hidden bg-surface-sidebar border-b border-white/6 shadow-2xl"
            >
              <nav className="mx-auto w-full max-w-none px-4 sm:px-6 lg:px-10 xl:px-16 py-3 flex flex-col gap-1" style={{ maxWidth: '1400px' }}>
                {NAV_LINKS.map(({ name, href, icon: Icon }) => {
                  const active = isActive(href);
                  return (
                    <Link
                      key={href}
                      to={href}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all
                        ${active
                          ? 'bg-primary-600/15 text-primary-400'
                          : 'text-muted hover:text-white hover:bg-white/5'
                        }`}
                    >
                      <Icon className="h-4 w-4 flex-shrink-0" />
                      {name}
                    </Link>
                  );
                })}
              </nav>
            </div>
          </>
        )}
      </header>

      {/* PAGE CONTENT */}
      <main style={{ flex: '1', width: '100%' }}>
        <div className="mx-auto w-full px-4 sm:px-6 lg:px-10 xl:px-16 py-5 sm:py-6 lg:py-8" style={{ maxWidth: '1400px' }}>
          {children}
        </div>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-white/6">
        <div className="text-center text-sm text-muted py-4">Phát triển bởi <span className="text-primary-400 font-medium">ProfitPulse Team</span> và dữ liệu được cập nhật định kỳ.</div>
      </footer>
    </div>
  );
};

export default Layout;
