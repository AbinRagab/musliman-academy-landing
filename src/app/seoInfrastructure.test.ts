import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();

describe('SEO infrastructure', () => {
  it('keeps dashboard routes local and noindex while serving the public site', () => {
    const vercelConfig = JSON.parse(readFileSync(resolve(root, 'vercel.json'), 'utf8'));

    expect(vercelConfig.rewrites[0]).toEqual(
      { source: '/dashboard/:path*', destination: '/index.html' },
    );
    const publicRoutes = vercelConfig.rewrites.slice(1);
    expect(publicRoutes.map((route: { source: string }) => route.source)).toEqual([
      '/', '/en/:path*', '/ar/:path*', '/es/:path*', '/de/:path*',
      '/it/:path*', '/ur/:path*', '/tr/:path*', '/_next/:path*',
      '/sitemap.xml', '/robots.txt', '/manifest.webmanifest', '/opengraph-image',
    ]);
    for (const route of publicRoutes) {
      const destination = new URL(route.destination);
      expect(destination.origin).toBe('https://musliman-academy-public.vercel.app');
      expect(destination.pathname).toBe(route.source);
    }
    expect(vercelConfig.headers).toContainEqual({
      source: '/dashboard/:path*',
      headers: [
        { key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive' },
      ],
    });
  });

  it('publishes only canonical, indexable URLs in the sitemap', () => {
    const sitemap = readFileSync(resolve(root, 'public/sitemap.xml'), 'utf8');

    expect(sitemap).toContain('<loc>https://www.muslimanacademy.com/</loc>');
    expect(sitemap).not.toContain('/dashboard');
  });

  it('does not include the ignored meta keywords tag', () => {
    const indexHtml = readFileSync(resolve(root, 'index.html'), 'utf8');

    expect(indexHtml).not.toMatch(/<meta\s+name=["']keywords["']/i);
  });
});
