import React, { createContext, useContext, useState } from 'react';
import { SupportedCurrency } from './types';

interface CurrencyContextType {
  currency: SupportedCurrency;
  setCurrency: (cur: SupportedCurrency) => void;
  convertPrice: (priceInMYR: number) => { value: number; formatted: string };
  formatMYR: (price: number) => string;
  formatPrice: (priceInMYR: number) => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

// Exchange rates relative to 1 MYR (Malaysian Ringgit)
const EXCHANGE_RATES: Record<SupportedCurrency, { rate: number; prefix: string; suffix: string }> = {
  MYR: { rate: 1.0, prefix: 'RM ', suffix: '' },
  SGD: { rate: 0.288, prefix: 'S$ ', suffix: '' },
  USD: { rate: 0.213, prefix: '$', suffix: '' },
  CNY: { rate: 1.547, prefix: 'CNY ¥ ', suffix: '' },
};

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currency, setCurrencyState] = useState<SupportedCurrency>(() => {
    const saved = localStorage.getItem('portal_cur');
    return (saved as SupportedCurrency) || 'MYR';
  });

  const setCurrency = (cur: SupportedCurrency) => {
    setCurrencyState(cur);
    localStorage.setItem('portal_cur', cur);
  };

  const convertPrice = (priceInMYR: number) => {
    if (!priceInMYR || isNaN(priceInMYR)) {
      return { value: 0, formatted: "Information Pending Verification" };
    }
    const config = EXCHANGE_RATES[currency];
    const converted = Math.round(priceInMYR * config.rate);
    const formatted = `${config.prefix}${converted.toLocaleString()}${config.suffix}`;
    return { value: converted, formatted };
  };

  const formatMYR = (price: number): string => {
    if (!price || isNaN(price)) return "Information Pending Verification";
    return `RM ${price.toLocaleString()}`;
  };

  const formatPrice = (priceInMYR: number): string => {
    return convertPrice(priceInMYR).formatted;
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, convertPrice, formatMYR, formatPrice }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};
