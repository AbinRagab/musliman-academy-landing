import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { landingTeachers } from '../landing/data/siteData';

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
    for (const path of ['/assets/index.js', '/dashboard-other', '/unknown', '/index.htm', '/index.html.map']) {
      expect(resolveRoute(path)).toBeUndefined();
    }
  });

  it('sends the old /index.html landing page to the public site root redirect', () => {
    const config = JSON.parse(readFileSync(resolve(root, 'vercel.json'), 'utf8'));
    const routes = config.routes as Array<{ src?: string; dest?: string; handle?: string }>;
    const firstMatch = (path: string) => routes.findIndex(route => route.src && new RegExp(route.src).test(path));
    const indexRule = firstMatch('/index.html');
    const dashboardRule = routes.findIndex(route => route.src?.startsWith('^/dashboard'));
    const filesystemIndex = routes.findIndex(route => route.handle === 'filesystem');
    expect(firstMatch('/index.html/')).toBe(indexRule);
    for (const path of ['/dashboard', '/dashboard/login', '/dashboard/admin/leads']) expect(firstMatch(path)).toBe(dashboardRule);
    // The public root decides the language and keeps booking parameters, so
    // /index.html reuses it instead of a second copy of that logic.
    expect(routes[indexRule].dest).toBe('https://musliman-academy-public.vercel.app/');
    // Before the Vite files, and after the dashboard rule, whose internal
    // rewrite to /index.html must keep serving the dashboard entry point.
    expect(indexRule).toBeGreaterThan(dashboardRule);
    expect(indexRule).toBeLessThan(filesystemIndex);
    expect(routes[dashboardRule].dest).toBe('/index.html');
  });

  it('forwards teacher portraits, which profile pages use as social images', () => {
    const config = JSON.parse(readFileSync(resolve(root, 'vercel.json'), 'utf8'));
    const routes = config.routes as Array<{ src?: string; dest?: string; handle?: string }>;
    const filesystemIndex = routes.findIndex(route => route.handle === 'filesystem');
    const portraitIndex = routes.findIndex(route => route.src?.startsWith('^/teacher-photos/'));
    const dashboardIndex = routes.findIndex(route => route.src?.startsWith('^/dashboard'));
    // Forwarded before the Vite files, and after the dashboard keeps its own rule.
    expect(portraitIndex).toBeGreaterThan(dashboardIndex);
    expect(portraitIndex).toBeLessThan(filesystemIndex);
    const resolveRoute = (path: string) => {
      const rule = routes.slice(0, filesystemIndex).find(route => new RegExp(route.src!).test(path));
      return rule && path.replace(new RegExp(rule.src!), rule.dest!);
    };
    const origin = 'https://musliman-academy-public.vercel.app';
    for (const { id } of landingTeachers) {
      expect(resolveRoute(`/teacher-photos/${id}.jpg`)).toBe(`${origin}/teacher-photos/${id}.jpg`);
    }
    // Only portrait-shaped file names are forwarded; nothing else under the
    // prefix reaches the public origin.
    for (const path of ['/teacher-photos', '/teacher-photos/', '/teacher-photos/mazin-yasser.png', '/teacher-photos/a/b.jpg', '/teacher-photos/Mazin-Yasser.jpg', '/teacher-photos/mazin-yasser.jpg/x', '/teacher-photosx/mazin-yasser.jpg']) {
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

  // index.html is now only the dashboard entry point, so its initial HTML
  // agrees with the X-Robots-Tag header before the app updates the tags.
  it('marks the dashboard entry document noindex from the first byte', () => {
    const indexHtml = readFileSync(resolve(root, 'index.html'), 'utf8');
    for (const name of ['robots', 'googlebot']) {
      const tags = [...indexHtml.matchAll(new RegExp(`<meta\\s+name="${name}"\\s+content="([^"]*)"`, 'g'))].map(match => match[1]);
      expect(tags).toEqual(['noindex, nofollow, noarchive']);
    }
    expect(indexHtml).toContain('<link rel="canonical" href="https://www.muslimanacademy.com/dashboard/" />');
    expect(indexHtml).not.toMatch(/content="index/);
  });
});
