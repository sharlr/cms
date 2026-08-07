"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { Language } from "./config";
import { DEFAULT_LANGUAGE, RTL_LANGUAGES } from "./config";
import { getTranslation, loadTranslation } from "./utils";

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string, replacements?: Record<string, string | number>) => string;
  translations: Record<string, any>;
  isRTL: boolean;
}

const defaultContextValue: LanguageContextType = {
  language: DEFAULT_LANGUAGE,
  setLanguage: () => {},
  t: (key: string) => key,
  translations: loadTranslation(DEFAULT_LANGUAGE),
  isRTL: false,
};

const LanguageContext = createContext<LanguageContextType>(defaultContextValue);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(DEFAULT_LANGUAGE);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Load from localStorage on mount
    const stored = localStorage.getItem("language") as Language | null;
    if (stored) {
      setLanguageState(stored);
      applyLanguage(stored);
    } else {
      applyLanguage(DEFAULT_LANGUAGE);
    }
    setMounted(true);
  }, []);

  const setLanguage = (lang: Language) => {
    console.log("🔄 Language change triggered:", lang, "current:", language);
    setLanguageState(lang);
    localStorage.setItem("language", lang);
    applyLanguage(lang);
  };

  const applyLanguage = (lang: Language) => {
    const html = document.documentElement;
    html.lang = lang;
    if (RTL_LANGUAGES.includes(lang)) {
      html.dir = "rtl";
    } else {
      html.dir = "ltr";
    }
  };

  const t = (key: string, replacements?: Record<string, string | number>) =>
    getTranslation(language, key, replacements);

  const translations = loadTranslation(language);
  const isRTL = RTL_LANGUAGES.includes(language);

  const value: LanguageContextType = {
    language,
    setLanguage,
    t,
    translations,
    isRTL,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  return context;
}
