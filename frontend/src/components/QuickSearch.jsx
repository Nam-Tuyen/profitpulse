import { useState, useEffect, useRef } from 'react';
import { Search, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

/**
 * QuickSearch Component
 * Fast company search with autocomplete
 */
const QuickSearch = ({ firms = [] }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef(null);
  const navigate = useNavigate();
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowResults(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  // Search logic
  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    
    const searchQuery = query.toLowerCase();
    const filtered = firms
      .filter(firm => 
        firm.toLowerCase().includes(searchQuery)
      )
      .slice(0, 10);
    
    setResults(filtered);
    setShowResults(true);
  }, [query, firms]);
  
  const handleSelect = (ticker) => {
    setQuery('');
    setShowResults(false);
    navigate(`/company/${ticker}`);
  };
  
  return (
    <div ref={searchRef} className="relative w-full max-w-md touch-manipulation">
      <div className="relative">
        <label htmlFor="quick-search" className="sr-only">Tìm kiếm công ty</label>
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted" />
        <input
          id="quick-search"
          name="company-search"
          type="search"
          autoComplete="off"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length >= 2 && setShowResults(true)}
          placeholder="Tìm mã (VD: VNM, FPT...)"
          className="w-full pl-10 pr-4 py-2.5 sm:py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm sm:text-base placeholder:text-muted focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
        />
      </div>
      
      {/* Results Dropdown */}
      {showResults && results.length > 0 && (
        <div className="absolute z-50 w-full mt-2 rounded-xl shadow-lg max-h-96 overflow-y-auto" style={{ background: 'rgba(26,32,53,0.95)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)' }}>
          {results.map((ticker, idx) => (
            <button
              key={idx}
              onClick={() => handleSelect(ticker)}
              className="w-full px-4 py-3 text-left hover:bg-white/5 transition-colors flex items-center space-x-3 border-b border-white/6 last:border-0"
            >
              <TrendingUp className="h-4 w-4 text-primary-400" />
              <span className="font-medium text-white">{ticker}</span>
            </button>
          ))}
        </div>
      )}
      
      {/* No Results */}
      {showResults && query.length >= 2 && results.length === 0 && (
        <div className="absolute z-50 w-full mt-2 rounded-xl shadow-lg p-4" style={{ background: 'rgba(26,32,53,0.95)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <p className="text-sm text-muted text-center">
            Không tìm thấy mã <strong className="text-white">{query}</strong>
          </p>
        </div>
      )}
    </div>
  );
};

export default QuickSearch;
