import { render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import en from '../../../src/i18n/locales/en.json';
import { direction, languageAlternates, languages, paths, siteUrl, teachers } from '../lib/catalog';
import { openGraphLocales } from '../lib/messages';
import copy from '../lib/teacher-pages.json';
import { teacherPhotoPath, teacherProfile } from '../lib/teacher-profiles';
import sitemap from './sitemap';
import Page, { generateMetadata } from './[lang]/[...segments]/page';
import { GET as photo, generateStaticParams as photoParams } from './teacher-photos/[file]/route';
import TeacherProfile from './teacher-profile';

vi.mock('../../../src/shared/services/programsService', () => ({
  usePrograms: () => ({ loading: false, error: null, programs: [], refetch: vi.fn() }),
}));

// Owner-confirmed facts; experience values are statements, not derived from dates.
const confirmed = [
  { id: 'mazin-yasser', key: 'mazinYasser', name: 'Mazin Yasser', experience: '3+ Years', years: '3' },
  { id: 'fatimah-al-shazly', key: 'fatimahAlShazly', name: 'Fatimah Al Shazly', experience: '5+ Years', years: '5' },
  { id: 'ahmed-yasser', key: 'ahmedYasser', name: 'Ahmed Yasser', experience: '2+ Years', years: '2' },
  { id: 'gehad-ragab', key: 'gehadRagab', name: 'Gehad Ragab', experience: '4+ Years', years: '4' },
  { id: 'yossef-abd-eltwab', key: 'yossefAbdEltwab', name: 'Yossef Abd Eltwab', experience: '3+ Years', years: '3' },
];
const combinations = languages.flatMap(lang => confirmed.map(teacher => ({ lang, ...teacher })));
const metadataFor = (lang: string, path: string) => generateMetadata({ params: Promise.resolve({ lang, segments: path.split('/') }) });
const placeholders = (value: string) => (value.match(/\{\{\s*\w+\s*\}\}/g) ?? []).sort();
type Copy = typeof copy.en;

describe('teacher records', () => {
  it('keeps the five confirmed teachers, slugs and portraits', () => {
    expect(teachers.map(teacher => teacher.id)).toEqual(confirmed.map(teacher => teacher.id));
    for (const expected of confirmed) {
      const teacher = teachers.find(candidate => candidate.id === expected.id)!;
      expect(teacher).toMatchObject({ key: expected.key, fullName: expected.name, experience: expected.experience, languages: ['Arabic', 'English'] });
      expect(teacher.specialization).toBe("Qur'an, Tajweed, Islamic Studies");
      expect(teacher.photo).toMatch(/^data:image\/jpeg;base64,/);
      expect(en.teachers.items[expected.key as keyof typeof en.teachers.items].name).toBe(expected.name);
    }
    expect(JSON.stringify(en)).not.toContain('Al_Shazly');
  });

  it('serves each approved portrait as a static JPEG', async () => {
    expect(photoParams()).toEqual(confirmed.map(teacher => ({ file: `${teacher.id}.jpg` })));
    for (const teacher of teachers) {
      const response = await photo(new Request(`${siteUrl}${teacherPhotoPath(teacher.id)}`), { params: Promise.resolve({ file: `${teacher.id}.jpg` }) });
      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('image/jpeg');
      const bytes = new Uint8Array(await response.arrayBuffer());
      expect(Buffer.from(bytes).toString('base64')).toBe(teacher.photo.split(',')[1]);
    }
    const missing = await photo(new Request(`${siteUrl}/teacher-photos/unknown.jpg`), { params: Promise.resolve({ file: 'unknown.jpg' }) });
    expect(missing.status).toBe(404);
  });
});

describe('localized teacher page copy', () => {
  it.each(languages)('%s has every field, placeholder and teacher', lang => {
    const english = copy.en as Copy;
    const localized = copy[lang] as Copy;
    expect(Object.keys(localized.ui).sort()).toEqual(Object.keys(english.ui).sort());
    for (const [key, value] of Object.entries(localized.ui)) {
      expect(typeof value, key).toBe('string');
      expect(value.trim(), key).not.toBe('');
      expect(placeholders(value), `${lang} ui.${key}`).toEqual(placeholders(english.ui[key as keyof Copy['ui']]));
      if (lang !== 'en') expect(value, `${lang} ui.${key} is still English`).not.toBe(english.ui[key as keyof Copy['ui']]);
    }
    expect(Object.keys(localized.teachers).sort()).toEqual(confirmed.map(teacher => teacher.key).sort());
    for (const teacher of confirmed) {
      const personal = localized.teachers[teacher.key as keyof Copy['teachers']];
      expect(Object.keys(personal).sort()).toEqual(['about', 'intro']);
      // Each introduction states that teacher's own experience figure.
      expect(personal.intro, `${lang} ${teacher.key}`).toMatch(teacher.key === 'ahmedYasser' && lang === 'ar' ? /سنتين/ : new RegExp(`(^|\\D)${teacher.years}(\\D|$)`));
      if (lang !== 'en') {
        expect(personal.intro).not.toBe(english.teachers[teacher.key as keyof Copy['teachers']].intro);
        expect(personal.about).not.toBe(english.teachers[teacher.key as keyof Copy['teachers']].about);
      }
    }
    // Five distinct introductions rather than one repeated biography.
    const structures = confirmed.map(teacher => localized.teachers[teacher.key as keyof Copy['teachers']].intro
      .replace(teacherProfile(lang, teacher.id)!.name, '#').replace(/\d+|سنتين/g, '#'));
    expect(new Set(structures).size).toBe(confirmed.length);
  });

  it('fills placeholders without leaving templates behind', () => {
    for (const { lang, id } of combinations) {
      const profile = teacherProfile(lang, id)!;
      for (const value of Object.values(profile.ui)) expect(value, `${lang} ${id}`).not.toMatch(/\{\{|\}\}/);
    }
  });
});

describe('teacher profile pages', () => {
  it.each(combinations)('$lang/teachers/$id renders the confirmed profile with localized SEO', async ({ lang, id, key }) => {
    const path = `teachers/${id}`;
    const url = `${siteUrl}/${lang}/${path}`;
    const profile = teacherProfile(lang, id)!;
    const localizedName = lang === 'en' ? confirmed.find(teacher => teacher.id === id)!.name : profile.name;
    expect(profile.name).toBe(localizedName);

    const metadata = await metadataFor(lang, path);
    expect(metadata.title).toBe(profile.ui.metaTitle);
    expect(metadata.description).toBe(profile.ui.metaDescription);
    expect(String(metadata.title)).toContain(profile.name);
    expect(String(metadata.description)).toContain(profile.experience);
    expect(metadata.alternates?.canonical).toBe(url);
    expect(metadata.alternates?.languages).toEqual(languageAlternates(path));
    const image = { url: `${siteUrl}/teacher-photos/${id}.jpg`, alt: profile.ui.imageAlt };
    expect(metadata.openGraph).toMatchObject({ url, title: profile.ui.metaTitle, description: profile.ui.metaDescription, locale: openGraphLocales[lang], images: [image] });
    expect(metadata.twitter).toMatchObject({ card: 'summary', title: profile.ui.metaTitle, description: profile.ui.metaDescription, images: [image] });

    const { container } = render(<TeacherProfile lang={lang} id={id} />);
    const page = container.querySelector('.teacher-page')!;
    expect(page.getAttribute('lang')).toBe(lang);
    expect(page.getAttribute('dir')).toBe(direction(lang));
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(profile.name);
    const portrait = container.querySelector<HTMLImageElement>('.teacher-hero__portrait img')!;
    expect(portrait.getAttribute('src')).toBe(`/teacher-photos/${id}.jpg`);
    expect(portrait.getAttribute('alt')).toBe(profile.ui.imageAlt);

    const facts = container.querySelector('.teacher-facts')!.textContent!;
    expect(facts).toContain(profile.experience);
    expect(facts).toContain(profile.specialization);
    for (const language of profile.languageNames) expect(facts).toContain(language);
    expect(profile.experience).toBe(lang === 'en' ? confirmed.find(teacher => teacher.key === key)!.experience : profile.experience);

    // The free trial is general: the form has no teacher field, so no teacher is passed.
    const cta = within(container.querySelector('.teacher-hero')! as HTMLElement).getByRole('link', { name: new RegExp(profile.ui.cta) });
    expect(cta.getAttribute('href')).toBe(`/${lang}#book-trial`);
    for (const link of Array.from(container.querySelectorAll<HTMLAnchorElement>('main a'))) {
      expect(link.getAttribute('href'), link.textContent ?? '').toMatch(new RegExp(`^/${lang}(/|#|$)`));
      expect(link.textContent?.trim()).toBeTruthy();
    }
    const subjectLinks = Array.from(container.querySelectorAll<HTMLAnchorElement>('.teacher-subject__link')).map(link => link.getAttribute('href'));
    expect(subjectLinks).toEqual([`/${lang}/programs/quran-reading`, `/${lang}/programs/tajweed`, `/${lang}/programs/islamic-studies`]);
    for (const subject of subjectLinks) expect(paths).toContain(subject!.slice(lang.length + 2));
    const related = Array.from(container.querySelectorAll<HTMLAnchorElement>('.teacher-profile-card__link')).map(link => link.getAttribute('href'));
    expect(related).toEqual(confirmed.filter(teacher => teacher.id !== id).map(teacher => `/${lang}/teachers/${teacher.id}`));
    expect(container.querySelectorAll('.teacher-faq details')).toHaveLength(5);
    expect(container.querySelectorAll('.teacher-steps li')).toHaveLength(4);

    const structured = Array.from(container.querySelectorAll('script[type="application/ld+json"]')).map(script => JSON.parse(script.textContent || '{}'));
    expect(structured.find(data => data['@type'] === 'BreadcrumbList')?.itemListElement.map((item: { item: string }) => item.item))
      .toEqual([`${siteUrl}/${lang}`, `${siteUrl}/${lang}/teachers`, url]);
    const person = structured.find(data => data['@type'] === 'ProfilePage')?.mainEntity;
    expect(person).toMatchObject({ '@type': 'Person', name: profile.name, url, image: image.url, knowsLanguage: ['ar', 'en'] });
    // Nothing beyond the visible, confirmed facts.
    for (const field of ['sameAs', 'award', 'alumniOf', 'hasCredential', 'aggregateRating', 'review']) expect(person).not.toHaveProperty(field);

    const text = page.textContent ?? '';
    expect(text).not.toMatch(/\{\{|\[object Object\]|teachers\.items\.|faq\.q\d|how\.steps/);
    if (lang !== 'en') {
      const english = teacherProfile('en', id)!;
      for (const value of [english.intro, english.about, english.ui.cta, english.ui.faqHeading, english.ui.howHeading, en.faq.q4.question, en.how.steps.freeTrial.title, 'View course', 'Experience']) {
        expect(text, `${lang} shows "${value}"`).not.toContain(value);
      }
    }
  });

  it('uses unique titles and descriptions for all 35 profiles', async () => {
    const all = await Promise.all(combinations.map(({ lang, id }) => metadataFor(lang, `teachers/${id}`)));
    expect(new Set(all.map(metadata => metadata.title)).size).toBe(combinations.length);
    expect(new Set(all.map(metadata => metadata.description)).size).toBe(combinations.length);
  });

  it.each(languages)('/%s/teachers links every card to its localized profile', async lang => {
    const { container } = render(await Page({ params: Promise.resolve({ lang, segments: ['teachers'] }) }));
    const cards = Array.from(container.querySelectorAll('.teacher-directory .teacher-profile-card'));
    expect(cards).toHaveLength(confirmed.length);
    for (const [index, card] of cards.entries()) {
      const links = card.querySelectorAll('a');
      // One link per card, never wrapped around other controls.
      expect(links).toHaveLength(1);
      expect(links[0].getAttribute('href')).toBe(`/${lang}/teachers/${confirmed[index].id}`);
      expect(links[0].textContent).toBe(teacherProfile(lang, confirmed[index].id)!.name);
      expect(card.querySelector('img')?.getAttribute('src')).toBe(`/teacher-photos/${confirmed[index].id}.jpg`);
    }
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
  });

  it('lists every teacher profile once in the sitemap with reciprocal alternates', () => {
    const entries = sitemap();
    for (const { lang, id } of combinations) {
      const matches = entries.filter(entry => entry.url === `${siteUrl}/${lang}/teachers/${id}`);
      expect(matches).toHaveLength(1);
      expect(matches[0].alternates?.languages).toEqual(languageAlternates(`teachers/${id}`));
    }
    expect(entries.some(entry => entry.url.includes('teacher-photos'))).toBe(false);
  });
});
