import React, { createContext, useContext, useState, useEffect } from 'react';
import { SupportedLanguage } from './types';
import { translations } from './translations';

interface LanguageContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  t: (key: string) => string;
  isRtl: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<SupportedLanguage>(() => {
    const saved = localStorage.getItem('portal_lang');
    return (saved as SupportedLanguage) || 'en';
  });

  const setLanguage = (lang: SupportedLanguage) => {
    setLanguageState(lang);
    localStorage.setItem('portal_lang', lang);
  };

  const t = (key: string): string => {
    try {
      const translationSet = translations[language] || translations['en'];
      return translationSet[key] || translations['en'][key] || key;
    } catch {
      return key;
    }
  };

  const isRtl = language === 'ar';

  useEffect(() => {
    // Set direction body attribute
    document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language, isRtl]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isRtl }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
