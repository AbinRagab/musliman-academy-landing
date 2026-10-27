import { render, screen } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { NextRequest } from 'next/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import en from '../../../src/i18n/locales/en.json';
import globalI18n from '../../../src/i18n';
import { languages, languageAlternates, siteUrl } from '../lib/catalog';
import { loadMessages } from '../lib/messages';
import { courseContent } from '../lib/course-content';
import { proxy } from '../proxy';
import CourseChrome from './course-chrome';
import LandingClient from './landing-client';
import RootLayout from './[lang]/layout';
import { generateMetadata } from './[lang]/page';
import { generateStaticParams as detailParams, generateMetadata as detailMetadata } from './[lang]/[...segments]/page';
import sitemap from './sitemap';

vi.mock('../../../src/shared/services/programsService', () => ({
  usePrograms: () => ({ loading: false, error: null, programs: [], refetch: vi.fn() }),
}));

const homeMetadata = (lang: string) => generateMetadata({ params: Promise.resolve({ lang }) });
const redirect = (url: string) => proxy(new NextRequest(new URL(url, 'http://localhost')));
const headline = (messages: typeof en) => messages.hero.headlineLine1;

describe('localized homepages', () => {
  afterEach(() => window.history.replaceState({}, '', '/'));

  it.each(languages)('/%s has localized metadata with reciprocal alternates', async lang => {
    const messages = await loadMessages(lang);
    const metadata = await homeMetadata(lang);
    expect(metadata.title).toEqual({ absolute: messages.seo.title });
    expect(metadata.description).toBe(messages.seo.description);
    expect(metadata.alternates?.canonical).toBe(`${siteUrl}/${lang}`);
    expect(metadata.alternates?.languages).toEqual(languageAlternates(''));
    expect(metadata.openGraph).toMatchObject({ url: `${siteUrl}/${lang}`, title: messages.seo.title, description: messages.seo.description });
    expect(metadata.twitter).toMatchObject({ title: messages.seo.title, description: messages.seo.description });
  });

  it('uses unique titles and descriptions per language', async () => {
    const all = await Promise.all(languages.map(loadMessages));
    expect(new Set(all.map(messages => messages.seo.title)).size).toBe(languages.length);
    expect(new Set(all.map(messages => messages.seo.description)).size).toBe(languages.length);
  });

  it('points every alternate at a localized homepage, with English as x-default', () => {
    const alternates = languageAlternates('');
    for (const lang of languages) expect(alternates[lang]).toBe(`${siteUrl}/${lang}`);
    expect(alternates['x-default']).toBe(`${siteUrl}/en`);
  });

  it.each([['en', 'ltr'], ['ar', 'rtl'], ['ur', 'rtl'], ['de', 'ltr'], ['tr', 'ltr']])('renders <html lang="%s" dir="%s"> on the server', async (lang, dir) => {
    const html = await RootLayout({ children: null, params: Promise.resolve({ lang }) });
    expect(html.props).toMatchObject({ lang, dir });
  });

  it('server-renders each language without sharing translation state', async () => {
    const [ar, de, ur] = await Promise.all([loadMessages('ar'), loadMessages('de'), loadMessages('ur')]);
    // Several trees in one render would show the same language if they shared an instance.
    const html = renderToString(<>
      <LandingClient lang="ar" messages={ar} />
      <LandingClient lang="de" messages={de} />
      <LandingClient lang="en" />
      <LandingClient lang="ur" messages={ur} />
    </>);
    for (const messages of [ar, de, en, ur]) expect(html).toContain(headline(messages));
    expect(globalI18n.isInitialized).toBeFalsy();
  });

  it('server-renders non-English homepages without English interface text', async () => {
    for (const lang of languages.filter(lang => lang !== 'en')) {
      const messages = await loadMessages(lang);
      const html = renderToString(<LandingClient lang={lang} messages={messages} />);
      for (const english of [en.hero.secondaryCta, en.how.steps.findPlan.text, en.faq.q1.question, en.whyChoose.items.allLevels.title, en.about.benefits.oneOnOne.text]) {
        expect(html, `${lang} contains "${english}"`).not.toContain(english);
      }
    }
  });

  it('links each language option to the equivalent localized page', async () => {
    const { container, unmount } = render(<LandingClient lang="ar" messages={await loadMessages('ar')} />);
    const links = Array.from(container.querySelectorAll<HTMLAnchorElement>('.navbar__actions a.language-switcher__option'));
    expect(links.map(link => link.getAttribute('href'))).toEqual(['/en', '/ar', '/es', '/de', '/it', '/ur', '/tr']);
    expect(links.find(link => link.getAttribute('aria-current') === 'page')?.getAttribute('hrefLang')).toBe('ar');
    unmount();
    const chrome = render(<CourseChrome lang="de" path="programs/tajweed" />);
    const detailLinks = Array.from(chrome.container.querySelectorAll<HTMLAnchorElement>('.navbar__actions a.language-switcher__option'));
    expect(detailLinks.map(link => link.getAttribute('href'))).toContain('/ur/programs/tajweed');
    expect(chrome.container.querySelector('.navbar a.brand-logo, .navbar a[href="/de"]')?.getAttribute('href')).toBe('/de');
  });

  it('preselects the requested program from booking links', async () => {
    window.history.replaceState({}, '', '/de?program=tajweed#book-trial');
    const { container } = render(<LandingClient lang="de" messages={await loadMessages('de')} />);
    expect(container.querySelector<HTMLSelectElement>('select[name="program"]')?.value).toBe('tajweed');
  });

  it.each(languages)('/%s preselects each expanded course program and opens training from course links', async lang => {
    const messages = lang === 'en' ? undefined : await loadMessages(lang);
    for (const program of ['tajweed', 'tarteelQaidah', 'islamicValues']) {
      window.history.replaceState({}, '', `/${lang}?program=${program}#book-trial`);
      const { container, unmount } = render(<LandingClient lang={lang} messages={messages} />);
      expect(container.querySelector<HTMLSelectElement>('select[name="program"]')?.value, `${lang} ${program}`).toBe(program);
      unmount();
    }
    window.history.replaceState({}, '', `/${lang}?type=training#book-trial`);
    render(<LandingClient lang={lang} messages={messages} />);
    expect((await screen.findByRole('tab', { name: (messages ?? en).booking.toggleTraining })).getAttribute('aria-selected')).toBe('true');
  });

  it('opens the teacher training form from training links', async () => {
    window.history.replaceState({}, '', '/ur?type=training#book-trial');
    const ur = await loadMessages('ur');
    render(<LandingClient lang="ur" messages={ur} />);
    expect((await screen.findByRole('tab', { name: ur.booking.toggleTraining })).getAttribute('aria-selected')).toBe('true');
    expect(document.querySelector('#book-trial select[name="trainingGoal"]')).not.toBeNull();
  });
});

describe('root and legacy homepage redirects', () => {
  it.each([
    ['/', 307, '/en'],
    ['/?lang=ar', 308, '/ar'],
    ['/?lang=ur&program=tajweed', 308, '/ur?program=tajweed'],
    ['/?program=quranReading&lang=de', 308, '/de?program=quranReading'],
    ['/?lang=tr&type=training', 308, '/tr?type=training'],
    ['/?lang=ar-EG', 308, '/ar'],
    ['/?lang=DE&program=tajweed', 308, '/de?program=tajweed'],
    ['/?lang=fr&program=tajweed', 307, '/en?program=tajweed'],
    ['/?lang=', 307, '/en'],
  ])('%s -> %s %s', (url, status, location) => {
    const response = redirect(url);
    expect(response.status).toBe(status);
    const target = new URL(response.headers.get('Location')!);
    expect(target.origin).toBe('http://localhost');
    expect(target.pathname + target.search).toBe(location);
  });
});

describe('sitemap and detail routes', () => {
  it('lists each localized homepage once and never the redirecting root', () => {
    const entries = sitemap();
    const urls = entries.map(entry => entry.url);
    expect(new Set(urls).size).toBe(urls.length);
    expect(urls).not.toContain(`${siteUrl}/`);
    for (const lang of languages) {
      const home = entries.filter(entry => entry.url === `${siteUrl}/${lang}`);
      expect(home).toHaveLength(1);
      expect(home[0].alternates?.languages).toEqual(languageAlternates(''));
    }
    expect(urls.some(url => url.includes('dashboard'))).toBe(false);
  });

  it('keeps every localized program and teacher route', async () => {
    const params = detailParams();
    expect(params).toHaveLength(languages.length * 17);
    const metadata = await detailMetadata({ params: Promise.resolve({ lang: 'ar', segments: ['programs', 'quran-memorization'] }) });
    expect(metadata.alternates?.canonical).toBe(`${siteUrl}/ar/programs/quran-memorization`);
    expect(metadata.alternates?.languages).toEqual(languageAlternates('programs/quran-memorization'));
  });
});

describe('confirmed academy statements', () => {
  it.each(languages)('/%s states the Teacher Training certificate without unconfirmed conditions', async lang => {
    const answer = courseContent('teacherTraining', lang)!.faq[6][1];
    expect(answer).toContain('Musliman Academy');
    const messages = lang === 'en' ? en : await loadMessages(lang);
    expect(messages.training.badges.certificate).toBeTruthy();
    if (lang === 'en') {
      expect(answer).toContain('Certificate of Completion issued by Musliman Academy');
      expect(answer).not.toMatch(/accredit|recogni[sz]ed|employment|guarantee|ask the team/i);
    }
  });

  it('keeps the corrected Arabic, Urdu and display-name wording', async () => {
    const [ar, ur] = await Promise.all([loadMessages('ar'), loadMessages('ur')]);
    expect(ar.hero.description).toContain('خريجي الأزهر');
    expect(ar.whyChoose.items.qualifiedTeachers.description).toContain('معتمدين');
    expect(ur.hero.description).toContain('الازہر');
    // Urdu now matches the English source: Islamic Studies, not Islamic values.
    expect(ur.training.description).toContain('اسلامی علوم');
    expect(ur.training.description).not.toContain('اقدار');
    for (const lang of languages) expect(JSON.stringify(await loadMessages(lang))).not.toContain('Al_Shazly');
  });

  // Teachers are confirmed as qualified and certified, not as Ijazah holders. The
  // only remaining mention is the qualification an applicant can pick on the form.
  it.each(languages)('/%s makes no Ijazah claim about academy teachers', async lang => {
    const messages = lang === 'en' ? en : await loadMessages(lang);
    const mentions: string[] = [];
    const walk = (value: unknown, path: string) => {
      if (typeof value === 'string') {
        if (/ija[sz]|icaze|إجاز|اجاز/i.test(value)) mentions.push(path);
      } else if (value && typeof value === 'object') {
        for (const [key, child] of Object.entries(value)) walk(child, path ? `${path}.${key}` : key);
      }
    };
    walk(messages, '');
    expect(mentions).toEqual(['booking.options.qualification.ijazahHolder']);
    expect(messages.trust.qualifiedCertified).toBeTruthy();
    expect(messages.trust).not.toHaveProperty('ijazahCertified');
  });
});
