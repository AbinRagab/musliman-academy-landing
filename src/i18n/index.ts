import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';

import en from './locales/en.json';
import ar from './locales/ar.json';
import es from './locales/es.json';
import de from './locales/de.json';
import it from './locales/it.json';
import ur from './locales/ur.json';
import tr from './locales/tr.json';

export const supportedLanguages = ['en', 'ar', 'es', 'de', 'it', 'ur', 'tr'] as const;
export type SupportedLanguage = (typeof supportedLanguages)[number];

const rtlLanguages: SupportedLanguage[] = ['ar', 'ur'];

export function normalizeLanguage(language?: string): SupportedLanguage {
  const shortCode = language?.split('-')[0] as SupportedLanguage | undefined;
  return shortCode && supportedLanguages.includes(shortCode) ? shortCode : 'en';
}

export function getLanguageDirection(language?: string) {
  return rtlLanguages.includes(normalizeLanguage(language)) ? 'rtl' : 'ltr';
}

export function updateDocumentLanguage(language?: string) {
  const normalizedLanguage = normalizeLanguage(language);
  document.documentElement.lang = normalizedLanguage;
  document.documentElement.dir = getLanguageDirection(normalizedLanguage);
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      ar: { translation: ar },
      es: { translation: es },
      de: { translation: de },
      it: { translation: it },
      ur: { translation: ur },
      tr: { translation: tr },
    },
    fallbackLng: 'en',
    supportedLngs: supportedLanguages,
    nonExplicitSupportedLngs: true,
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'htmlTag', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
    },
  });

if (typeof document !== 'undefined') {
  updateDocumentLanguage(i18n.resolvedLanguage || i18n.language);
  i18n.on('languageChanged', updateDocumentLanguage);
}

export default i18n;
