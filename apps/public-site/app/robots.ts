import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // /dashboard stays crawlable so crawlers can read its noindex header;
      // robots.txt and noindex control indexing, not access.
      disallow: ['/login', '/auth/'],
    },
    sitemap: 'https://www.muslimanacademy.com/sitemap.xml',
  };
}
