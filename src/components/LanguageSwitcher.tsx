"use client";

import { useLanguage } from "@/i18n/LanguageContext";
import { LANGUAGES, LANGUAGE_LABELS } from "@/i18n/config";

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex gap-1">
      {LANGUAGES.map((lang) => (
        <button
          key={lang}
          onClick={() => setLanguage(lang)}
          className={`px-2 py-1 rounded text-sm font-medium transition-colors ${
            language === lang
              ? "bg-brand-600 text-white"
              : "bg-surface-2 text-ink-soft hover:text-ink"
          }`}
          title={LANGUAGE_LABELS[lang]}
        >
          {lang.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
