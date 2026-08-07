export const LANGUAGES = ["fr", "en", "ar"] as const;
export type Language = (typeof LANGUAGES)[number];

export const LANGUAGE_LABELS: Record<Language, string> = {
  fr: "Français",
  en: "English",
  ar: "العربية",
};

export const DEFAULT_LANGUAGE: Language = "fr";

export const RTL_LANGUAGES: Language[] = ["ar"];
