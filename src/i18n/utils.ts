import type { Language } from "./config";
import { DEFAULT_LANGUAGE } from "./config";
import frTranslations from "./translations/fr.json";
import enTranslations from "./translations/en.json";
import arTranslations from "./translations/ar.json";

type TranslationKeys = {
  common: {
    hello: string;
    welcome: string;
    loading: string;
    error: string;
    success: string;
  };
  nav: {
    ranking: string;
    participations: string;
    news: string;
    logout: string;
  };
  home: {
    greeting: string;
    chooseContest: string;
    training: string;
    lastResult: string;
    seeDetails: string;
    viewAll: string;
    information: string;
    informationPlaceholder: string;
    seeRanking: string;
    myParticipations: string;
  };
  contest: {
    edition: string;
    locked: string;
    open: string;
    questions: string;
    secondsPerQuestion: string;
    singleParticipation: string;
    openingDate: string;
    startContest: string;
    train: string;
    buttonActivates: string;
    contestClosed: string;
    noQuestions: string;
    notOpened: string;
    noPublishedQuestions: string;
    unavailable: string;
  };
  auth: {
    login: string;
    logout: string;
    email: string;
    password: string;
    forgotPassword: string;
    noAccount: string;
    createAccount: string;
  };
  tagline: string;
  slogan: string;
  pitch: string;
};

const translations: Record<Language, TranslationKeys> = {
  fr: frTranslations as TranslationKeys,
  en: enTranslations as TranslationKeys,
  ar: arTranslations as TranslationKeys,
};

export function getTranslation(
  language: Language,
  key: string,
  replacements?: Record<string, string | number>
): string {
  const keys = key.split(".");
  let value: any = translations[language] || translations[DEFAULT_LANGUAGE];

  for (const k of keys) {
    value = value?.[k];
    if (!value) {
      console.warn(`Translation key not found: ${key}`);
      return key;
    }
  }

  if (typeof value !== "string") return key;

  // Replace placeholders like {name} or {count}
  if (replacements) {
    return value.replace(/\{(\w+)\}/g, (_, key) =>
      String(replacements[key] ?? `{${key}}`)
    );
  }

  return value;
}

export function loadTranslation(language: Language): TranslationKeys {
  return translations[language] || translations[DEFAULT_LANGUAGE];
}
