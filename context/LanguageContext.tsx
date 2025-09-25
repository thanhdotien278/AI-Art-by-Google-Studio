import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';

type Language = 'vi' | 'en';

// Since we can no longer infer keys from a static import, we use string.
type TranslationKey = string;

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey, params?: Record<string, string>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const initialTranslations: Record<Language, Record<string, string>> = {
    en: {},
    vi: {}
};

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('vi');
  const [translations, setTranslations] = useState(initialTranslations);

  useEffect(() => {
    const fetchTranslations = async () => {
      try {
        const [enRes, viRes] = await Promise.all([
          fetch('./locales/en.json'),
          fetch('./locales/vi.json')
        ]);
        if (!enRes.ok || !viRes.ok) {
            throw new Error('Failed to fetch translation files');
        }
        const enData = await enRes.json();
        const viData = await viRes.json();
        setTranslations({ en: enData, vi: viData });
      } catch (error) {
        console.error("Failed to load translation files:", error);
      }
    };
    fetchTranslations();
  }, []); // Run once on component mount

  const t = (key: TranslationKey, params: Record<string, string> = {}) => {
    const stringKey = String(key);
    let text = translations[language]?.[stringKey] || stringKey;
    Object.keys(params).forEach(param => {
        text = text.replace(`{${param}}`, params[param]);
    });
    return text;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
