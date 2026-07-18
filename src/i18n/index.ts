import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en.json';

export const supportedLanguages = ['en', 'ar', 'es', 'de', 'it', 'ur', 'tr'] as const;
export type SupportedLanguage = (typeof supportedLanguages)[number];

const rtlLanguages: SupportedLanguage[] = ['ar', 'ur'];
type LocaleResource = Record<string, unknown>;
const localeLoaders: Record<SupportedLanguage, () => Promise<LocaleResource>> = {
  en: () => Promise.resolve(en),
  ar: () => import('./locales/ar.json').then((module) => module.default),
  es: () => import('./locales/es.json').then((module) => module.default),
  de: () => import('./locales/de.json').then((module) => module.default),
  it: () => import('./locales/it.json').then((module) => module.default),
  ur: () => import('./locales/ur.json').then((module) => module.default),
  tr: () => import('./locales/tr.json').then((module) => module.default),
};
let i18nReady: Promise<void> | null = null;

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

function detectInitialLanguage() {
  if (typeof window === 'undefined') {
    return 'en';
  }

  return normalizeLanguage(
    window.localStorage.getItem('i18nextLng')
    || document.documentElement.lang
    || window.navigator.languages?.[0]
    || window.navigator.language,
  );
}

export async function loadLanguageResource(language: string) {
  const normalizedLanguage = normalizeLanguage(language);

  if (!i18n.hasResourceBundle(normalizedLanguage, 'translation')) {
    const translations = await localeLoaders[normalizedLanguage]();
    i18n.addResourceBundle(normalizedLanguage, 'translation', translations, true, true);
  }
}

export function initializeI18n() {
  if (i18nReady) {
    return i18nReady;
  }

  i18nReady = (async () => {
    let initialLanguage = detectInitialLanguage();
    let initialTranslation: LocaleResource | null = null;

    if (initialLanguage !== 'en') {
      try {
        initialTranslation = await localeLoaders[initialLanguage]();
      } catch {
        initialLanguage = 'en';
      }
    }

    const initialResources = {
      en: { translation: en },
      ...(initialLanguage === 'en'
        ? {}
        : { [initialLanguage]: { translation: initialTranslation } }),
    };

    await i18n.use(initReactI18next).init({
    resources: {
      ...initialResources,
    },
    lng: initialLanguage,
    fallbackLng: 'en',
    supportedLngs: supportedLanguages,
    nonExplicitSupportedLngs: true,
    interpolation: {
      escapeValue: false,
    },
  });

    if (typeof document !== 'undefined') {
      updateDocumentLanguage(i18n.resolvedLanguage || i18n.language);
      i18n.on('languageChanged', updateDocumentLanguage);
    }
  })();

  return i18nReady;
}

export default i18n;
