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
    // Both lesson formats are offered, so the description names both.
    const description = 'Build confident Quran reading with qualified Egyptian teachers in live one-to-one or small-group lessons. Learn at your pace and book a free trial.';
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

  it('asks the owner-confirmed questions, in order', () => {
    const copy = courseContent('quranReading', 'en')!;
    expect(copy.faq.map(([question]) => question)).toEqual([
      'Can I join if I cannot read Arabic yet?',
      'What is the difference between Quran Reading and Tajweed?',
      'Is this suitable for children and adults?',
      'How do the live lessons work?',
      'What reading skills does this program focus on?',
      'Is this an Arabic conversation course?',
      'How long does it take to improve?',
      'How do I choose the right starting program?',
    ]);
    const answer = (question: string) => copy.faq.find(([q]) => q === question)![1];
    // The question about lesson format matches an answer covering both formats.
    expect(answer('How do the live lessons work?')).toMatch(/one-to-one or in a small group/);
    expect(copy.lessons).toMatch(/one-to-one or small-group/);
    // Reading skills only: no statement either way about memorization.
    expect(answer('What reading skills does this program focus on?')).toMatch(/pronunciation.*accuracy and fluency/);
  });

  it('leaves the starting program to the trial teacher, without assigning beginners', () => {
    const copy = courseContent('quranReading', 'en')!;
    const answer = (question: string) => copy.faq.find(([q]) => q === question)![1];
    // Everywhere the starting point comes up, the trial teacher assesses and recommends.
    for (const text of [copy.requirements, copy.guide!.text, answer('Can I join if I cannot read Arabic yet?'), answer('How do I choose the right starting program?')]) {
      expect(text).toMatch(/free trial/i);
      expect(text).toMatch(/teacher (will )?assess/);
      expect(text).toMatch(/recommend/);
    }
    // Tarteel Qaidah is a possible recommendation, never an automatic placement.
    for (const text of [copy.requirements, answer('Can I join if I cannot read Arabic yet?')]) expect(text).toMatch(/Tarteel Qaidah may be the recommended first step/);
    expect(copy.audience[0]).toMatch(/^Beginners/);
    expect(copy.requirements).toMatch(/do not need to read fluently before booking a free trial/);
  });

  it('makes no unconfirmed promises, age limits or memorization policy', () => {
    const all = JSON.stringify(courseContent('quranReading', 'en'));
    expect(all).not.toMatch(/certificate|ijazah|guarantee|discount|price|\$|\d+\s*(weeks?|months?)|refund/i);
    expect(all).not.toMatch(/memori[sz]|hifz|surah/i);
    expect(all).not.toMatch(/minimum age|years? old|aged? \d|\d+\s*(\+|and (over|above|up))|ages? \d/i);
    expect(all).not.toMatch(/group(s)? of \d|up to \d+ (students|learners)/i);
  });

  it('gives each curriculum module its own description', () => {
    const copy = courseContent('quranReading', 'en')!;
    const { container } = render(<CourseDetail lang="en" courseKey="quranReading" />);
    const modules = Array.from(container.querySelectorAll('#course-curriculum details')).map(module => ({
      title: module.querySelector('summary')!.textContent!.replace(/^\d+/, ''),
      body: module.querySelector('summary')!.nextElementSibling!.textContent,
    }));
    expect(modules).toEqual([
      { title: 'Reading marks in Quranic words', body: 'Understand how short vowels, Sukoon, Shaddah, and Tanween guide the reading of Quranic words, with examples and guided practice.' },
      { title: 'Connecting letters into words and verses', body: 'Practise recognizing connected letter forms and combining sounds to read Quranic words and verses accurately.' },
      { title: 'Developing reading fluency', body: 'Build a steadier reading flow through guided practice, with attention to accuracy rather than rushing.' },
      { title: 'Improving pronunciation', body: 'Receive live corrections on pronunciation and practise the areas that need more attention.' },
    ]);
    // The prerequisite and delivery copy keep their own sections instead of filling the modules.
    const curriculum = container.querySelector('#course-curriculum')!.textContent!;
    expect(curriculum).not.toContain(copy.requirements);
    expect(curriculum).not.toContain(copy.lessons);
    expect(container.querySelectorAll('#course-curriculum > p')).toHaveLength(0);
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
    for (const field of ['metaTitle', 'metaDescription', 'guide', 'curriculum'] as const) expect(copy[field]).toBeUndefined();
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
