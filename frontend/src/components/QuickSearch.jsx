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
    <div ref={searchRef} className="relative w-full max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length >= 2 && setShowResults(true)}
          placeholder="Tìm mã công ty (VD: VNM, FPT, VCB...)"
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
        />
      </div>
      
      {/* Results Dropdown */}
      {showResults && results.length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-y-auto">
          {results.map((ticker, idx) => (
            <button
              key={idx}
              onClick={() => handleSelect(ticker)}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center space-x-3 border-b border-gray-100 last:border-0"
            >
              <TrendingUp className="h-4 w-4 text-primary-600" />
              <span className="font-medium text-gray-900">{ticker}</span>
            </button>
          ))}
        </div>
      )}
      
      {/* No Results */}
      {showResults && query.length >= 2 && results.length === 0 && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-4">
          <p className="text-sm text-gray-500 text-center">
            Không tìm thấy mã <strong>{query}</strong>
          </p>
        </div>
      )}
    </div>
  );
};

export default QuickSearch;
