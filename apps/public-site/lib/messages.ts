import type { Language } from './catalog';

type Messages = typeof import('../../../src/i18n/locales/en.json');

// Each homepage request loads only its own language on the server.
const loaders: Record<Language, () => Promise<Messages>> = {
  en: () => import('../../../src/i18n/locales/en.json').then(module => module.default),
  ar: () => import('../../../src/i18n/locales/ar.json').then(module => module.default as Messages),
  es: () => import('../../../src/i18n/locales/es.json').then(module => module.default as Messages),
  de: () => import('../../../src/i18n/locales/de.json').then(module => module.default as Messages),
  it: () => import('../../../src/i18n/locales/it.json').then(module => module.default as Messages),
  ur: () => import('../../../src/i18n/locales/ur.json').then(module => module.default as Messages),
  tr: () => import('../../../src/i18n/locales/tr.json').then(module => module.default as Messages),
};

export function loadMessages(lang: Language) {
  return loaders[lang]();
}

// Open Graph requires a territory; these are the conventional defaults.
export const openGraphLocales: Record<Language, string> = {
  en: 'en_US',
  ar: 'ar_AR',
  es: 'es_ES',
  de: 'de_DE',
  it: 'it_IT',
  ur: 'ur_PK',
  tr: 'tr_TR',
};
