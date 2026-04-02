
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Language, Currency } from '../types';
import i18n from '../i18n';
import { useTranslation } from 'react-i18next';

interface SettingsContextType {
  language: Language;
  currency: Currency;
  isB2BMode: boolean;
  setLanguage: (lang: Language) => void;
  setCurrency: (curr: Currency) => void;
  toggleB2BMode: () => void;
  formatPrice: (amount: number) => string;
  formatDate: (date: string | number | Date, options?: Intl.DateTimeFormatOptions) => string;
  t: (key: string) => string;
  dir: 'ltr' | 'rtl';
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

// Exchange Rates (Mock)
const RATES: Record<Currency, number> = {
  'INR': 1,
  'USD': 0.012,
  'EUR': 0.011,
  'GBP': 0.0095
};

const LOCALE_MAP: Record<Language, string> = {
  'en': 'en-IN',
  'hi': 'hi-IN',
  'ta': 'ta-IN',
  'bn': 'bn-IN',
  'te': 'te-IN',
  'ur': 'ur-IN'
};

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { t: i18nT } = useTranslation();
  const [language, setLanguage] = useState<Language>('en');
  const [currency, setCurrency] = useState<Currency>('INR');
  const [isB2BMode, setIsB2BMode] = useState(false);

  useEffect(() => {
    // 1. Load Settings
    const storedLang = localStorage.getItem('oneyatra_lang');
    const storedCurr = localStorage.getItem('oneyatra_curr');
    const storedB2B = localStorage.getItem('oneyatra_b2b');

    if (storedLang) {
      setLanguage(storedLang as Language);
      i18n.changeLanguage(storedLang);
    } else {
      // Auto-detect browser language
      const browserLang = navigator.language.split('-')[0];
      if (['hi', 'ta', 'bn', 'te', 'ur'].includes(browserLang)) {
        setLanguage(browserLang as Language);
        i18n.changeLanguage(browserLang);
      }
    }

    if (storedCurr) setCurrency(storedCurr as Currency);
    if (storedB2B) setIsB2BMode(storedB2B === 'true');
  }, []);

  // Handle RTL for Urdu
  useEffect(() => {
    if (language === 'ur') {
      document.documentElement.dir = 'rtl';
      document.documentElement.lang = 'ur';
    } else {
      document.documentElement.dir = 'ltr';
      document.documentElement.lang = language;
    }
  }, [language]);

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    i18n.changeLanguage(lang);
    localStorage.setItem('oneyatra_lang', lang);
  };

  const handleSetCurrency = (curr: Currency) => {
    setCurrency(curr);
    localStorage.setItem('oneyatra_curr', curr);
  };

  const toggleB2BMode = () => {
    const newVal = !isB2BMode;
    setIsB2BMode(newVal);
    localStorage.setItem('oneyatra_b2b', String(newVal));
  };

  const formatPrice = (amountInInr: number): string => {
    const rate = RATES[currency];
    const converted = amountInInr * rate;
    return new Intl.NumberFormat(LOCALE_MAP[language], {
      style: 'currency',
      currency: currency,
      maximumFractionDigits: currency === 'INR' ? 0 : 2
    }).format(converted);
  };

  const formatDate = (date: string | number | Date, options?: Intl.DateTimeFormatOptions): string => {
    const d = new Date(date);
    if (isNaN(d.getTime())) return String(date);
    
    return new Intl.DateTimeFormat(LOCALE_MAP[language], options || {
      day: 'numeric',
      month: 'short',
      weekday: 'short'
    }).format(d);
  };

  const t = (key: string): string => {
    return i18nT(key);
  };

  return (
    <SettingsContext.Provider value={{
      language,
      currency,
      isB2BMode,
      setLanguage: handleSetLanguage,
      setCurrency: handleSetCurrency,
      toggleB2BMode,
      formatPrice,
      formatDate,
      t,
      dir: language === 'ur' ? 'rtl' : 'ltr'
    }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) throw new Error("useSettings must be used within SettingsProvider");
  return context;
};
