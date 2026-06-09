import { createContext, useContext, useState, useEffect } from 'react';

const CurrencyContext = createContext();

export const useCurrency = () => useContext(CurrencyContext);

export const CurrencyProvider = ({ children }) => {
  // Try to load currency from general settings first
  const [currency, setCurrency] = useState(() => {
    const settings = localStorage.getItem('jhoraji_settings');
    if (settings) {
      try {
        const parsed = JSON.parse(settings);
        if (parsed.currency) return parsed.currency;
      } catch (e) {}
    }
    return localStorage.getItem('jhoraji_currency') || 'USD';
  });

  useEffect(() => {
    localStorage.setItem('jhoraji_currency', currency);
  }, [currency]);

  // Sync currency from Settings changes
  useEffect(() => {
    const handleStorageChange = () => {
      const settings = localStorage.getItem('jhoraji_settings');
      if (settings) {
        try {
          const parsed = JSON.parse(settings);
          if (parsed.currency && parsed.currency !== currency) {
            setCurrency(parsed.currency);
          }
        } catch (e) {}
      }
    };
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('settings_updated', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('settings_updated', handleStorageChange);
    };
  }, [currency]);

  const formatPrice = (amount) => {
    // If it's a string that already has symbols, strip it
    const numAmount = typeof amount === 'string' ? parseFloat(amount.replace(/[^0-9.-]+/g, "")) : amount;
    
    if (isNaN(numAmount)) return amount; // Si no es un numero valido, retornarlo igual.

    if (currency === 'USD') {
      return `US$ ${numAmount.toFixed(2)}`;
    } else if (currency === 'EUR') {
      return `€ ${numAmount.toFixed(2)}`;
    } else if (currency === 'DOP') {
      return `RD$ ${numAmount.toFixed(2)}`;
    }
    
    return `$ ${numAmount.toFixed(2)}`;
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, formatPrice }}>
      {children}
    </CurrencyContext.Provider>
  );
};
