// The academy's public identity: one source for the brand name, the stable
// structured-data IDs and the official profiles. Dependency-free and data-only,
// so server components can share it without pulling in client code.
import { languages, siteUrl } from './languages';

export const brandName = 'Musliman Academy';
// The domain-level home page. `/` redirects to a localized homepage, which
// carries the site identity for the whole domain (not one per language).
export const homeUrl = `${siteUrl}/`;
export const organizationId = `${homeUrl}#organization`;
export const websiteId = `${homeUrl}#website`;
// Only the bare domain, which people type as one word; never a different brand.
const alternateName = 'muslimanacademy.com';

// The full wordmark for light backgrounds (the header logo), so it stays readable on white.
export const brandLogo = { url: `${siteUrl}/assets/musliman-logo-light-bg-transparent.png`, width: 640, height: 247 };

// The same accounts the footer links to.
export const socialProfiles = [
  'https://www.facebook.com/muslimanacademy',
  'https://www.instagram.com/muslimanacademy/',
  'https://www.linkedin.com/company/musliman-academy/',
  'https://www.tiktok.com/@muslimanacademy',
  'https://www.youtube.com/@muslimanacademy',
];

// How other entities (courses, teachers, pages) point at the academy.
export const organizationReference = { '@type': 'EducationalOrganization', '@id': organizationId, name: brandName, url: homeUrl };

export const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'EducationalOrganization',
  '@id': organizationId,
  name: brandName,
  alternateName,
  url: homeUrl,
  logo: { '@type': 'ImageObject', '@id': `${homeUrl}#logo`, url: brandLogo.url, contentUrl: brandLogo.url, width: brandLogo.width, height: brandLogo.height, caption: brandName },
  image: { '@id': `${homeUrl}#logo` },
  description: 'Online Quran, Arabic, Tajweed, and Islamic Studies classes for non-Arabic speakers.',
  sameAs: socialProfiles,
};

export const websiteJsonLd = {
  '@type': 'WebSite',
  '@id': websiteId,
  name: brandName,
  alternateName,
  url: homeUrl,
  inLanguage: [...languages],
  publisher: { '@id': organizationId },
};

export function jsonLdHtml(data: unknown) {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}
