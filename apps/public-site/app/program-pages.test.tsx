import { render, screen, within } from '@testing-library/react';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import i18n, { initializeI18n } from '../../../src/i18n';
import LandingPage from '../../../src/landing/LandingPage';
import { courseBookingHref, courseContent, type CourseContent } from '../lib/course-content';
import { direction, languageAlternates, languages, paths, siteUrl } from '../lib/catalog';
import { openGraphLocales } from '../lib/messages';
import sitemap from './sitemap';
import { generateMetadata } from './[lang]/[...segments]/page';
import CourseDetail from './course-detail';

vi.mock('../../../src/shared/services/programsService', () => ({
  usePrograms: () => ({ loading: false, error: null, programs: [], refetch: vi.fn() }),
}));

const pages = [
  { key: 'tajweed', path: 'programs/tajweed', booking: '?program=tajweed#book-trial' },
  { key: 'tarteelQaidah', path: 'programs/tarteel-qaidah', booking: '?program=tarteelQaidah#book-trial' },
  { key: 'islamicValues', path: 'programs/islamic-values-for-children', booking: '?program=islamicValues#book-trial' },
  { key: 'teacherTraining', path: 'programs/teacher-training', booking: '?type=training#book-trial' },
];
const combinations = languages.flatMap(lang => pages.map(page => ({ lang, ...page })));
const metadataFor = (lang: string, path: string) => generateMetadata({ params: Promise.resolve({ lang, segments: path.split('/') }) });

// Proper names and transliterated Tajweed terms that are written the same way in several languages.
const sharedTerms = new Set(['Tajweed', 'Tarteel Qaidah', 'Sukoon', 'Tanween', 'Shaddah']);
// Fields copied from English rather than translated: routing identifiers and asset paths.
const untranslated = new Set(['image', 'related', 'slug']);

// Walks two content trees in parallel and reports any difference in shape or value type.
function compareShape(english: unknown, localized: unknown, where: string, problems: string[]) {
  if (typeof english !== typeof localized || Array.isArray(english) !== Array.isArray(localized)) {
    problems.push(`${where}: ${typeof localized} instead of ${typeof english}`);
  } else if (Array.isArray(english)) {
    const items = localized as unknown[];
    if (items.length !== english.length) problems.push(`${where}: ${items.length} items instead of ${english.length}`);
    english.forEach((item, i) => compareShape(item, items[i], `${where}[${i}]`, problems));
  } else if (english && typeof english === 'object') {
    const keys = (value: object) => Object.keys(value).sort().join(',');
    if (keys(english) !== keys(localized as object)) problems.push(`${where}: keys ${keys(localized as object)}`);
    for (const [key, value] of Object.entries(english)) compareShape(value, (localized as Record<string, unknown>)[key], `${where}.${key}`, problems);
  } else if (typeof english === 'string' && !(localized as string).trim()) {
    problems.push(`${where}: empty`);
  }
}

// Collects every translated string with its path, skipping routing identifiers and asset paths.
function strings(value: unknown, where = ''): [string, string][] {
  if (typeof value === 'string') return [[where, value]];
  if (Array.isArray(value)) return value.flatMap((item, i) => strings(item, `${where}[${i}]`));
  if (value && typeof value === 'object') return Object.entries(value).flatMap(([key, item]) => untranslated.has(key) ? [] : strings(item, `${where}.${key}`));
  return [];
}

const placeholders = (value: string) => (value.match(/\{\{\s*\w+\s*\}\}/g) ?? []).sort();

describe('expanded program pages in every language', () => {
  beforeAll(async () => {
    await initializeI18n('en');
  });

  it.each(combinations)('$lang/$path has complete detailed content', ({ lang, key }) => {
    const english = courseContent(key, 'en')!;
    const copy = courseContent(key, lang);
    expect(copy, `${lang} ${key}`).toBeDefined();
    const problems: string[] = [];
    compareShape(english, copy, key, problems);
    expect(problems).toEqual([]);
    for (const field of ['metaTitle', 'metaDescription', 'title', 'intro', 'eyebrow', 'imageAlt'] as const) expect(copy![field]).toBeTruthy();
    expect(copy!.faq.length).toBeGreaterThanOrEqual(6);
    for (const [, answer] of copy!.faq) expect(answer).toBeTruthy();
    if (lang === 'en') return;

    const englishStrings = new Map(strings(english));
    for (const [where, value] of strings(copy)) {
      expect(placeholders(value), where).toEqual(placeholders(englishStrings.get(where)!));
      if (value === englishStrings.get(where)) expect(sharedTerms.has(value), `${lang}${where} is still English: "${value}"`).toBe(true);
    }
  });

  it.each(combinations)('$lang/$path renders translated content with localized booking and SEO', async ({ lang, key, path, booking }) => {
    const copy = courseContent(key, lang)!;
    const english = courseContent(key, 'en')!;
    const bookingHref = `/${lang}${booking}`;
    expect(courseBookingHref(lang, key)).toBe(bookingHref);

    const metadata = await metadataFor(lang, path);
    expect(metadata.title).toBe(copy.metaTitle);
    expect(metadata.description).toBe(copy.metaDescription);
    expect(metadata.alternates?.canonical).toBe(`${siteUrl}/${lang}/${path}`);
    expect(metadata.alternates?.languages).toEqual(languageAlternates(path));
    expect(metadata.openGraph).toMatchObject({ title: copy.metaTitle, description: copy.metaDescription, url: `${siteUrl}/${lang}/${path}`, locale: openGraphLocales[lang] });
    expect(metadata.twitter).toMatchObject({ title: copy.metaTitle, description: copy.metaDescription });

    const { container } = render(<CourseDetail lang={lang} courseKey={key} />);
    const page = container.querySelector('.course-page')!;
    expect(page.getAttribute('lang')).toBe(lang);
    expect(page.getAttribute('dir')).toBe(direction(lang));
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(copy.title);
    expect(container.querySelector('.course-hero-image img')?.getAttribute('alt')).toBe(copy.imageAlt);
    for (const [question] of copy.faq) expect(page.textContent).toContain(question);
    for (const module of copy.curriculum!) expect(page.textContent).toContain(module.title);

    const bookingLinks = Array.from(container.querySelectorAll<HTMLAnchorElement>('a.course-button:not(.course-button-outline)'));
    expect(bookingLinks.length).toBeGreaterThan(0);
    for (const link of bookingLinks) expect(link.getAttribute('href')).toBe(bookingHref);
    const internalLinks = Array.from(container.querySelectorAll<HTMLAnchorElement>('.course-related a, .course-guide a, .course-breadcrumb a'));
    for (const link of internalLinks) {
      expect(link.getAttribute('href')).toMatch(new RegExp(`^/${lang}(/|$)`));
      expect(link.textContent?.trim()).toBeTruthy();
    }

    const structured = Array.from(container.querySelectorAll('script[type="application/ld+json"]')).map(script => JSON.parse(script.textContent || '{}'));
    expect(structured.find(data => data['@type'] === 'Course')).toMatchObject({ name: copy.title, description: copy.intro, inLanguage: lang, url: `${siteUrl}/${lang}/${path}` });
    expect(structured.find(data => data['@type'] === 'BreadcrumbList')?.itemListElement.map((item: { item: string }) => item.item))
      .toEqual([`${siteUrl}/${lang}`, `${siteUrl}/${lang}/programs`, `${siteUrl}/${lang}/${path}`]);

    // Keyed lists must not repeat a key, or React drops items.
    for (const list of [copy.features!, copy.journey!, copy.curriculum!, copy.guide?.items ?? [], copy.cta?.points ?? []]) {
      expect(new Set(list.map(item => item.title)).size).toBe(list.length);
    }
    for (const list of [copy.audience, copy.learn, copy.outcomes!, copy.faq.map(([question]) => question)]) expect(new Set(list).size).toBe(list.length);

    const text = page.textContent ?? '';
    expect(text).not.toMatch(/\[object Object\]|programs\.items\.|training\.cta|about\.benefits/);
    if (lang !== 'en') {
      for (const english_ of [english.title, english.intro, english.faq[0][0], english.curriculum![0].title, 'Curriculum', 'Related programs', 'What you will need']) {
        expect(text, `${lang} shows "${english_}"`).not.toContain(english_);
      }
    }
  });

  it('lists every localized route exactly once in the sitemap', () => {
    const urls = sitemap().map(entry => entry.url);
    expect(new Set(urls).size).toBe(urls.length);
    expect(urls).toHaveLength(languages.length * (paths.length + 1));
    for (const lang of languages) {
      for (const path of paths) expect(urls.filter(url => url === `${siteUrl}/${lang}/${path}`)).toHaveLength(1);
    }
    for (const { path } of pages) expect(paths).toContain(path);
  });

  it('keeps the other detailed courses in every language', () => {
    for (const lang of languages) {
      for (const key of ['quranReading', 'quranTajweed', 'arabicLanguage', 'quranMemorization', 'islamicStudies', 'quranTafseer']) {
        expect(courseContent(key, lang) as CourseContent | undefined, `${lang} ${key}`).toBeDefined();
      }
    }
  });

  it('opens the teacher training form when training is requested', async () => {
    await i18n.changeLanguage('en');
    render(<LandingPage requestedBookingType="training" />);
    const form = document.querySelector('#book-trial form') as HTMLFormElement;
    expect(within(form).getByRole('option', { name: 'Select training goal' })).toBeTruthy();
    expect(form.querySelector('select[name="program"]')).toBeNull();
    expect(screen.getByRole('tab', { name: 'Teacher Training' }).getAttribute('aria-selected')).toBe('true');
  });
});
