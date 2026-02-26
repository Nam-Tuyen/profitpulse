import { useState, useEffect } from 'react';

/**
 * useWatchlist Hook
 * Manages watchlist in localStorage
 */
const WATCHLIST_KEY = 'profitpulse_watchlist';

export const useWatchlist = () => {
  const [watchlist, setWatchlist] = useState([]);
  
  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(WATCHLIST_KEY);
      if (stored) {
        setWatchlist(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading watchlist:', error);
    }
  }, []);
  
  // Save to localStorage whenever watchlist changes
  useEffect(() => {
    try {
      localStorage.setItem(WATCHLIST_KEY, JSON.stringify(watchlist));
    } catch (error) {
      console.error('Error saving watchlist:', error);
    }
  }, [watchlist]);
  
  const isInWatchlist = (ticker) => {
    return watchlist.includes(ticker);
  };
  
  const addToWatchlist = (ticker) => {
    if (!watchlist.includes(ticker)) {
      setWatchlist([...watchlist, ticker]);
      return true;
    }
    return false;
  };
  
  const removeFromWatchlist = (ticker) => {
    setWatchlist(watchlist.filter(t => t !== ticker));
  };
  
  const toggleWatchlist = (ticker) => {
    if (isInWatchlist(ticker)) {
      removeFromWatchlist(ticker);
      return false;
    } else {
      addToWatchlist(ticker);
      return true;
    }
  };
  
  const clearWatchlist = () => {
    setWatchlist([]);
  };
  
  const addMultiple = (tickers) => {
    const uniqueTickers = [...new Set([...watchlist, ...tickers])];
    setWatchlist(uniqueTickers);
  };
  
  return {
    watchlist,
    isInWatchlist,
    addToWatchlist,
    removeFromWatchlist,
    toggleWatchlist,
    clearWatchlist,
    addMultiple,
    count: watchlist.length
  };
};

export default useWatchlist;
