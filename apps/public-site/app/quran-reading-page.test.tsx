import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { organizationId } from '../lib/brand';
import { courseBookingHref, courseContent } from '../lib/course-content';
import { direction, languageAlternates, languages, siteUrl, socialImage } from '../lib/catalog';
import { metadata as layoutMetadata } from './[lang]/layout';
import { generateMetadata } from './[lang]/[...segments]/page';
import CourseDetail from './course-detail';

vi.mock('../../../src/shared/services/programsService', () => ({
  usePrograms: () => ({ loading: false, error: null, programs: [], refetch: vi.fn() }),
}));

const path = 'programs/quran-reading';
const url = `${siteUrl}/en/${path}`;
const metadataFor = (lang: string) => generateMetadata({ params: Promise.resolve({ lang, segments: path.split('/') }) });
const structuredData = (container: HTMLElement) => Array.from(container.querySelectorAll('script[type="application/ld+json"]')).map(script => JSON.parse(script.textContent || '{}'));

// The localized pages keep their own copy until their translations are revised.
const localizedTitles: Record<string, string> = {
  ar: 'تعلّم قراءة القرآن بثقة',
  es: 'Aprende a leer el Corán con confianza',
  de: 'Den Koran mit Vertrauen lesen lernen',
  it: 'Impara a leggere il Corano con fiducia',
  ur: 'اعتماد کے ساتھ قرآن پڑھنا سیکھیں',
  tr: 'Kur’an okumayı güvenle öğrenin',
};

describe('English Quran Reading page', () => {
  it('targets learning to read the Quran online, with the brand once', async () => {
    const metadata = await metadataFor('en');
    const description = 'Build accurate, confident Quran reading through live one-to-one lessons with qualified Egyptian teachers. Learn at your pace and book a free trial.';
    expect(metadata.title).toBe('Learn to Read Quran Online');
    expect((layoutMetadata.title as { template: string }).template.replace('%s', String(metadata.title))).toBe('Learn to Read Quran Online | Musliman Academy');
    expect(metadata.description).toBe(description);
    expect(metadata.openGraph).toMatchObject({ siteName: 'Musliman Academy', title: 'Learn to Read Quran Online', description, url, images: [socialImage] });
    expect(metadata.twitter).toMatchObject({ card: 'summary_large_image', title: 'Learn to Read Quran Online', description, images: [socialImage] });
    expect(metadata.alternates).toEqual({ canonical: url, languages: languageAlternates(path) });
    expect(languageAlternates(path)['x-default']).toBe(url);
  });

  it('renders one H1, the reading-focused introduction and an English booking link', () => {
    const copy = courseContent('quranReading', 'en')!;
    const { container } = render(<CourseDetail lang="en" courseKey="quranReading" />);
    expect(screen.getAllByRole('heading', { level: 1 }).map(heading => heading.textContent)).toEqual(['Learn to Read the Quran Online with Confidence']);
    expect(container.querySelector('.course-lead')?.textContent).toBe(copy.intro);
    expect(copy.intro).toMatch(/words and verses/);
    const bookingLinks = Array.from(container.querySelectorAll<HTMLAnchorElement>('a.course-button:not(.course-button-outline)'));
    expect(bookingLinks.length).toBeGreaterThan(0);
    for (const link of bookingLinks) expect(link.getAttribute('href')).toBe('/en?program=quranReading#book-trial');
  });

  it('helps learners choose between the four Quran programs', () => {
    const { container } = render(<CourseDetail lang="en" courseKey="quranReading" />);
    const guide = screen.getByRole('heading', { level: 2, name: 'Which Quran program should you start with?' }).closest('section')!;
    expect(guide.textContent).toMatch(/free trial/);
    const links = Array.from(guide.querySelectorAll<HTMLAnchorElement>('a')).map(link => [link.querySelector('strong')?.textContent, link.getAttribute('href')]);
    expect(links).toEqual([
      ['Tarteel Qaidah', '/en/programs/tarteel-qaidah'],
      ['Tajweed', '/en/programs/tajweed'],
      ['Quran & Tajweed', '/en/programs/quran-tajweed'],
    ]);
    // This page is listed as the current program, not as a link to itself.
    expect(guide.querySelector('.course-guide-current strong')?.textContent).toBe('Quran Reading');
    expect(container.querySelector(`.course-guide a[href="/en/${path}"]`)).toBeNull();
  });

  it('answers program-choice questions without unconfirmed promises', () => {
    const copy = courseContent('quranReading', 'en')!;
    const questions = copy.faq.map(([question]) => question);
    for (const question of ['Can I join if I cannot read Arabic yet?', 'What is the difference between Quran Reading and Tajweed?', 'Is this suitable for children and adults?', 'How do one-to-one lessons work?', 'Can I improve my reading without starting memorization?', 'How do I choose the right starting program?']) {
      expect(questions).toContain(question);
    }
    expect(new Set(questions).size).toBe(questions.length);
    const all = JSON.stringify(copy);
    expect(all).not.toMatch(/certificate|ijazah|guarantee|discount|price|\$|\d+\s*(weeks?|months?)|refund/i);
  });

  it('describes the English course once, linked to the academy', () => {
    const copy = courseContent('quranReading', 'en')!;
    const { container } = render(<CourseDetail lang="en" courseKey="quranReading" />);
    const data = structuredData(container);
    expect(data.filter(item => item['@type'] === 'Course')).toEqual([{
      '@context': 'https://schema.org', '@type': 'Course', name: copy.title, description: copy.intro, inLanguage: 'en', url,
      provider: { '@type': 'EducationalOrganization', '@id': organizationId, name: 'Musliman Academy', url: `${siteUrl}/` },
    }]);
    expect(data.find(item => item['@type'] === 'BreadcrumbList')?.itemListElement.map((item: { name: string; item: string }) => [item.name, item.item]))
      .toEqual([['Home', `${siteUrl}/en`], ['Programs', `${siteUrl}/en/programs`], [copy.title, url]]);
  });

  it.each(languages.filter(lang => lang !== 'en'))('keeps the existing /%s Quran Reading page unchanged', async lang => {
    const copy = courseContent('quranReading', lang)!;
    expect(copy.title).toBe(localizedTitles[lang]);
    // No English-only additions leak into the translations.
    for (const field of ['metaTitle', 'metaDescription', 'guide'] as const) expect(copy[field]).toBeUndefined();
    expect(copy.faq).toHaveLength(3);
    const metadata = await metadataFor(lang);
    expect(metadata.title).toBe(copy.title);
    expect(metadata.alternates).toEqual({ canonical: `${siteUrl}/${lang}/${path}`, languages: languageAlternates(path) });
    expect(courseBookingHref(lang, 'quranReading')).toBe(`/${lang}?program=quranReading#book-trial`);
    const { container } = render(<CourseDetail lang={lang} courseKey="quranReading" />);
    expect(container.querySelector('.course-page')?.getAttribute('dir')).toBe(direction(lang));
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(copy.title);
    expect(structuredData(container).map(item => item['@type'])).toEqual(['BreadcrumbList']);
  });
});
