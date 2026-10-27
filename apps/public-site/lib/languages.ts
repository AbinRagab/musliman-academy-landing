// Dependency-free language primitives, safe to import from proxy.ts.
export const languages = ['en','ar','es','de','it','ur','tr'] as const;
export type Language = typeof languages[number];
export const defaultLanguage: Language = 'en';
export const siteUrl = 'https://www.muslimanacademy.com';

export function isLanguage(value: string | null | undefined): value is Language {
  return languages.includes(value as Language);
}

export function direction(lang: string) {
  return lang === 'ar' || lang === 'ur' ? 'rtl' : 'ltr';
}

// app/opengraph-image sits outside the [lang] root layout, so pages attach it
// explicitly; its alt text matches the English-only artwork.
export const socialImage = { url: '/opengraph-image', width: 1200, height: 630, alt: 'Musliman Academy online Quran and Arabic classes' };

// Localized paths never end in a slash, matching Next's default trailingSlash.
export function localizedPath(lang: string, path = '') {
  return `/${lang}${path ? `/${path}` : ''}`;
}
