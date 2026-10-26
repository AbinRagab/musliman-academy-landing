import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();

describe('SEO infrastructure', () => {
  it('routes public pages before static files and keeps the dashboard local', () => {
    const config = JSON.parse(readFileSync(resolve(root, 'vercel.json'), 'utf8'));
    expect(config.rewrites).toBeUndefined();
    expect(config.headers).toBeUndefined();
    const filesystemIndex = config.routes.findIndex((route: { handle?: string }) => route.handle === 'filesystem');
    expect(filesystemIndex).toBeGreaterThan(0);
    const rules = config.routes.slice(0, filesystemIndex) as Array<{ src: string; dest: string; headers?: Record<string, string> }>;
    const resolveRoute = (path: string) => {
      const rule = rules.find(route => new RegExp(route.src).test(path));
      return rule ? { destination: path.replace(new RegExp(rule.src), rule.dest), headers: rule.headers } : undefined;
    };
    const origin = 'https://musliman-academy-public.vercel.app';
    for (const path of ['/', '/en', '/ar', '/ur', '/en/programs', '/ar/programs/quran-tajweed', '/de/teachers/mazin-yasser', '/_next/static/app.js', '/sitemap.xml', '/robots.txt', '/manifest.webmanifest', '/opengraph-image']) {
      expect(resolveRoute(path)?.destination).toBe(origin + path);
    }
    // Localized homepages are canonical without a trailing slash.
    expect(resolveRoute('/de/')?.destination).toBe(`${origin}/de`);
    expect(resolveRoute('/fr')).toBeUndefined();
    for (const path of ['/dashboard', '/dashboard/login', '/dashboard/admin/leads']) {
      expect(resolveRoute(path)).toEqual({
        destination: '/index.html',
        headers: { 'X-Robots-Tag': 'noindex, nofollow, noarchive' },
      });
    }
    for (const path of ['/assets/index.js', '/index.html', '/dashboard-other', '/unknown']) {
      expect(resolveRoute(path)).toBeUndefined();
    }
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
