import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { isValidElement, type ReactNode } from 'react';
import { renderToString } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { languages, paths, siteUrl } from '../lib/catalog';
import { brandLogo, brandName, homeUrl, organizationId, organizationJsonLd, socialProfiles, websiteId } from '../lib/brand';
import RootLayout from './[lang]/layout';
import HomePage, { generateMetadata as homeMetadata } from './[lang]/page';
import DetailPage, { generateMetadata as detailMetadata } from './[lang]/[...segments]/page';

vi.mock('../../../src/shared/services/programsService', () => ({
  usePrograms: () => ({ loading: false, error: null, programs: [], refetch: vi.fn() }),
}));

type Entity = Record<string, unknown> & { '@type'?: string; '@id'?: string };
const root = process.cwd();
const jsonLdIn = (html: string) => [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(match => JSON.parse(match[1]));

// The layout's own JSON-LD, read from its element tree (it renders <html>).
async function layoutJsonLd(lang: string) {
  const found: unknown[] = [];
  const walk = (node: ReactNode) => {
    if (Array.isArray(node)) return node.forEach(walk);
    if (!isValidElement<{ children?: ReactNode; type?: string; dangerouslySetInnerHTML?: { __html: string } }>(node)) return;
    if (node.props.type === 'application/ld+json') found.push(JSON.parse(node.props.dangerouslySetInnerHTML!.__html));
    walk(node.props.children);
  };
  walk(await RootLayout({ children: null, params: Promise.resolve({ lang }) }));
  return found;
}

// Every typed node, including nested ones and @graph members.
function entities(data: unknown, out: Entity[] = []) {
  if (Array.isArray(data)) data.forEach(item => entities(item, out));
  else if (data && typeof data === 'object') {
    if ('@type' in data) out.push(data as Entity);
    Object.values(data).forEach(value => entities(value, out));
  }
  return out;
}

// All structured data on a page, as the layout and the page emit it together.
async function pageStructuredData(lang: string, page: ReactNode) {
  return [...await layoutJsonLd(lang), ...jsonLdIn(renderToString(<>{page}</>))];
}

function expectCoherentIdentity(blocks: unknown[]) {
  const nodes = entities(blocks);
  const definitions = new Map<string, Entity>();
  for (const node of nodes.filter(node => node['@id'])) {
    // Each ID names one thing: repeated mentions agree on type, name and URL.
    const previous = definitions.get(node['@id']!);
    if (previous) for (const field of ['@type', 'name', 'url'] as const) if (node[field] && previous[field]) expect(node[field], node['@id']).toEqual(previous[field]);
    if (!previous || Object.keys(node).length > Object.keys(previous).length) definitions.set(node['@id']!, node);
  }
  // Every reference resolves to an entity defined on the same page.
  const references: string[] = [];
  const collect = (data: unknown) => {
    if (Array.isArray(data)) return data.forEach(collect);
    if (!data || typeof data !== 'object') return;
    const keys = Object.keys(data);
    if (keys.length === 1 && keys[0] === '@id') references.push((data as Entity)['@id']!);
    Object.values(data).forEach(collect);
  };
  collect(blocks);
  for (const id of references) expect(definitions.has(id), `unresolved ${id}`).toBe(true);
  // No anonymous second copy of the academy or the website.
  for (const node of nodes.filter(node => /Organization|WebSite/.test(node['@type']!))) {
    expect(node['@id'], JSON.stringify(node)).toMatch(/#(organization|website)$/);
    expect(node.name).toBe(brandName);
    expect(node.url).toBe(homeUrl);
  }
  // The full academy definition (with its profiles) appears exactly once.
  expect(nodes.filter(node => node['@id'] === organizationId && node.sameAs)).toHaveLength(1);
  return nodes;
}

describe('brand identity', () => {
  it('uses one brand name and stable domain-level IDs', () => {
    expect(brandName).toBe('Musliman Academy');
    expect(homeUrl).toBe('https://www.muslimanacademy.com/');
    expect(organizationId).toBe('https://www.muslimanacademy.com/#organization');
    expect(websiteId).toBe('https://www.muslimanacademy.com/#website');
    expect(organizationJsonLd).toMatchObject({ '@type': 'EducationalOrganization', '@id': organizationId, name: brandName, url: homeUrl, alternateName: 'muslimanacademy.com' });
    // Nothing the site does not show or the owner has not confirmed.
    for (const field of ['legalName', 'address', 'foundingDate', 'aggregateRating', 'award', 'hasCredential', 'taxID', 'identifier']) expect(organizationJsonLd).not.toHaveProperty(field);
  });

  it('describes the academy with the full wordmark, readable on white', () => {
    const file = readFileSync(resolve(root, 'public', new URL(brandLogo.url).pathname.slice(1)));
    expect(brandLogo.url).toBe(`${siteUrl}/assets/musliman-logo-light-bg-transparent.png`);
    expect(file.subarray(1, 4).toString()).toBe('PNG');
    expect({ width: file.readUInt32BE(16), height: file.readUInt32BE(20) }).toEqual({ width: brandLogo.width, height: brandLogo.height });
    expect(Math.min(brandLogo.width, brandLogo.height)).toBeGreaterThanOrEqual(112);
    expect(organizationJsonLd.logo).toMatchObject({ '@type': 'ImageObject', url: brandLogo.url, width: brandLogo.width, height: brandLogo.height });
  });

  it('links the same official profiles as the footer', () => {
    const landing = readFileSync(resolve(root, 'src/landing/LandingPage.tsx'), 'utf8');
    const footer = landing.slice(landing.indexOf('const faqSocialLinks'), landing.indexOf('];', landing.indexOf('const faqSocialLinks')));
    expect([...footer.matchAll(/url: '([^']+)'/g)].map(match => match[1])).toEqual(socialProfiles);
    expect(organizationJsonLd.sameAs).toEqual(socialProfiles);
  });

  it.each(languages)('/%s carries the one domain-level WebSite, published by the academy', async lang => {
    const blocks = await pageStructuredData(lang, await HomePage({ params: Promise.resolve({ lang }) }));
    const nodes = expectCoherentIdentity(blocks);
    const websites = nodes.filter(node => node['@type'] === 'WebSite');
    expect(websites).toHaveLength(1);
    expect(websites[0]).toEqual({
      '@type': 'WebSite', '@id': websiteId, name: brandName, alternateName: 'muslimanacademy.com', url: homeUrl,
      inLanguage: [...languages], publisher: { '@id': organizationId },
    });
    expect(nodes.find(node => node['@type'] === 'WebPage')).toMatchObject({
      '@id': `${siteUrl}/${lang}#webpage`, url: `${siteUrl}/${lang}`, inLanguage: lang,
      isPartOf: { '@id': websiteId }, about: { '@id': organizationId }, publisher: { '@id': organizationId },
    });
  });

  it.each([
    ['en', 'programs'], ['ar', 'teachers'], ['ur', 'programs/tajweed'], ['de', 'programs/teacher-training'],
    ['en', 'teachers/mazin-yasser'], ['ar', 'teachers/gehad-ragab'],
  ])('/%s/%s references the same academy and defines no second website', async (lang, path) => {
    const page = await DetailPage({ params: Promise.resolve({ lang, segments: path.split('/') }) });
    const nodes = expectCoherentIdentity(await pageStructuredData(lang, page));
    expect(nodes.filter(node => node['@type'] === 'WebSite')).toHaveLength(0);
    for (const node of nodes.filter(node => node['@type'] === 'Course')) expect(node.provider).toMatchObject({ '@id': organizationId });
    for (const node of nodes.filter(node => node['@type'] === 'Person')) expect(node.worksFor).toMatchObject({ '@id': organizationId });
  });

  it('sets og:site_name on every homepage, directory, course and teacher page', async () => {
    const all = [
      ...await Promise.all(languages.map(lang => homeMetadata({ params: Promise.resolve({ lang }) }))),
      ...await Promise.all(languages.flatMap(lang => paths.map(path => detailMetadata({ params: Promise.resolve({ lang, segments: path.split('/') }) })))),
    ];
    expect(all).toHaveLength(languages.length * (paths.length + 1));
    for (const metadata of all) expect(metadata.openGraph).toMatchObject({ siteName: brandName });
  });

  it('never renders the brand as a translated name, which in Urdu reads "Muslim Academy"', () => {
    const files = [
      ...languages.map(lang => `src/i18n/locales/${lang}.json`),
      ...['additional-courses', 'arabic-language', 'program-directory', 'program-pages', 'quran-reading', 'quran-tajweed', 'teacher-pages'].map(name => `apps/public-site/lib/${name}.json`),
    ];
    for (const file of files) expect(readFileSync(resolve(root, file), 'utf8'), file).not.toMatch(/مسلمان اکیڈمی|أكاديمية مسلمان|muslim academy/i);
  });

  it('keeps the noindexed dashboard document free of a second academy definition', () => {
    const indexHtml = readFileSync(resolve(root, 'index.html'), 'utf8');
    expect(indexHtml).not.toContain('application/ld+json');
    expect(indexHtml).toContain('<meta property="og:url" content="https://www.muslimanacademy.com/dashboard/" />');
    expect(indexHtml).toContain('<meta name="robots" content="noindex, nofollow, noarchive" />');
  });
});
