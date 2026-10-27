import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import LandingClient from '../landing-client';
import { isLanguage, labels, languageAlternates, languages, localizedPath, siteUrl, socialImage } from '../../lib/catalog';
import { loadMessages, openGraphLocales } from '../../lib/messages';
import { brandName, jsonLdHtml, organizationId, websiteId, websiteJsonLd } from '../../lib/brand';

type Props = { params: Promise<{ lang: string }> };

async function resolve(params: Props['params']) {
  const { lang } = await params;
  if (!isLanguage(lang)) notFound();
  return { lang, messages: await loadMessages(lang), url: siteUrl + localizedPath(lang) };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, messages, url } = await resolve(params);
  const { title, description } = messages.seo;
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: url, languages: languageAlternates('') },
    openGraph: {
      type: 'website',
      siteName: brandName,
      url,
      title,
      description,
      locale: openGraphLocales[lang],
      alternateLocale: languages.filter(other => other !== lang).map(other => openGraphLocales[other]),
      images: [socialImage],
    },
    twitter: { card: 'summary_large_image', title, description, images: [socialImage] },
  };
}

export default async function HomePage({ params }: Props) {
  const { lang, messages, url } = await resolve(params);
  const l = labels[lang];
  // `/` redirects here, so every localized homepage carries the same
  // domain-level WebSite (one @id, name and URL), not a website per language.
  const homeGraph = {
    '@context': 'https://schema.org',
    '@graph': [
      websiteJsonLd,
      {
        '@type': 'WebPage',
        '@id': `${url}#webpage`,
        name: messages.seo.title,
        description: messages.seo.description,
        url,
        inLanguage: lang,
        isPartOf: { '@id': websiteId },
        about: { '@id': organizationId },
        publisher: { '@id': organizationId },
      },
    ],
  };
  return <>
    {/* English is bundled with the client; other languages travel with this page only. */}
    <LandingClient lang={lang} messages={lang === 'en' ? undefined : messages} />
    <nav style={{ padding: '24px', textAlign: 'center' }} aria-label={l[1]}>
      <Link href={localizedPath(lang, 'programs')}>{l[9]}</Link> · <Link href={localizedPath(lang, 'teachers')}>{l[2]}</Link>
    </nav>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdHtml(homeGraph) }} />
  </>;
}
