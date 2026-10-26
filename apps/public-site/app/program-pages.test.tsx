import { render, screen, within } from '@testing-library/react';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import i18n, { initializeI18n } from '../../../src/i18n';
import LandingPage from '../../../src/landing/LandingPage';
import { courseBookingHref, courseContent } from '../lib/course-content';
import { languages, paths, siteUrl } from '../lib/catalog';
import sitemap from './sitemap';
import { generateMetadata } from './[lang]/[...segments]/page';
import CourseDetail from './course-detail';

vi.mock('../../../src/shared/services/programsService', () => ({
  usePrograms: () => ({ loading: false, error: null, programs: [], refetch: vi.fn() }),
}));

const pages = [
  { key: 'tajweed', path: 'programs/tajweed', booking: '/en?program=tajweed#book-trial' },
  { key: 'tarteelQaidah', path: 'programs/tarteel-qaidah', booking: '/en?program=tarteelQaidah#book-trial' },
  { key: 'islamicValues', path: 'programs/islamic-values-for-children', booking: '/en?program=islamicValues#book-trial' },
  { key: 'teacherTraining', path: 'programs/teacher-training', booking: '/en?type=training#book-trial' },
];
const metadataFor = (lang: string, path: string) => generateMetadata({ params: Promise.resolve({ lang, segments: path.split('/') }) });

describe('expanded English program pages', () => {
  beforeAll(async () => {
    await initializeI18n('en');
  });

  it.each(pages)('renders detailed content for $path', async ({ key, path, booking }) => {
    const copy = courseContent(key, 'en')!;
    expect(copy.faq.length).toBeGreaterThanOrEqual(6);
    expect(copy.faq.length).toBeLessThanOrEqual(8);
    expect(courseBookingHref('en', key)).toBe(booking);

    const metadata = await metadataFor('en', path);
    expect(metadata.title).toBe(copy.metaTitle);
    expect(metadata.description).toBe(copy.metaDescription);
    expect(metadata.alternates?.canonical).toBe(`${siteUrl}/en/${path}`);
    expect(Object.keys(metadata.alternates?.languages ?? {})).toEqual([...languages, 'x-default']);

    const { container } = render(<CourseDetail lang="en" courseKey={key} />);
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(copy.title);
    const bookingLinks = Array.from(container.querySelectorAll<HTMLAnchorElement>('a.course-button:not(.course-button-outline)'));
    expect(bookingLinks.length).toBeGreaterThan(0);
    for (const link of bookingLinks) expect(link.getAttribute('href')).toBe(booking);
    const course = Array.from(container.querySelectorAll('script[type="application/ld+json"]'))
      .map(script => JSON.parse(script.textContent || '{}'))
      .find(data => data['@type'] === 'Course');
    expect(course).toMatchObject({ name: copy.title, description: copy.intro, url: `${siteUrl}/en/${path}` });
  });

  it('keeps untranslated languages on their existing localized pages', async () => {
    for (const lang of languages.filter(lang => lang !== 'en')) {
      for (const { key, path } of pages) {
        expect(courseContent(key, lang)).toBeUndefined();
        const metadata = await metadataFor(lang, path);
        expect(metadata.alternates?.canonical).toBe(`${siteUrl}/${lang}/${path}`);
      }
      expect(courseContent('quranMemorization', lang)).toBeDefined();
      expect(courseContent('quranReading', lang)).toBeDefined();
    }
  });

  it('lists every English route exactly once in the sitemap', () => {
    const urls = sitemap().map(entry => entry.url);
    expect(new Set(urls).size).toBe(urls.length);
    for (const path of paths) expect(urls.filter(url => url === `${siteUrl}/en/${path}`)).toHaveLength(1);
    for (const { path } of pages) expect(paths).toContain(path);
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
