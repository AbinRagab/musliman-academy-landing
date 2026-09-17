import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();

describe('SEO infrastructure', () => {
  it('rewrites dashboard routes only and marks them noindex', () => {
    const vercelConfig = JSON.parse(readFileSync(resolve(root, 'vercel.json'), 'utf8'));

    expect(vercelConfig.rewrites).toEqual([
      { source: '/dashboard/:path*', destination: '/index.html' },
    ]);
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
