type MetaSelector = { name: string } | { property: string };

export type PageSeo = {
  title: string;
  description: string;
  canonical: string;
  robots?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogUrl?: string;
  ogImage?: string;
  ogImageAlt?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  jsonLd?: Record<string, unknown> | Array<Record<string, unknown>>;
};

function getMeta(selector: MetaSelector) {
  const attribute = 'name' in selector ? 'name' : 'property';
  const value = 'name' in selector ? selector.name : selector.property;
  let element = document.querySelector<HTMLMetaElement>(`meta[${attribute}="${value}"]`);

  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attribute, value);
    document.head.appendChild(element);
  }

  return element;
}

function setMeta(selector: MetaSelector, content?: string) {
  if (!content) {
    return;
  }

  getMeta(selector).content = content;
}

function setCanonical(href: string) {
  let link = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');

  if (!link) {
    link = document.createElement('link');
    link.rel = 'canonical';
    document.head.appendChild(link);
  }

  link.href = href;
}

function setJsonLd(id: string, data?: PageSeo['jsonLd']) {
  const existing = document.getElementById(id);

  if (!data) {
    existing?.remove();
    return;
  }

  const script = (existing as HTMLScriptElement | null) ?? document.createElement('script');
  script.id = id;
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify(data);

  if (!existing) {
    document.head.appendChild(script);
  }
}

export function applyPageSeo(seo: PageSeo) {
  document.title = seo.title;
  setMeta({ name: 'description' }, seo.description);
  setMeta({ name: 'robots' }, seo.robots ?? 'index, follow');
  setCanonical(seo.canonical);

  setMeta({ property: 'og:title' }, seo.ogTitle ?? seo.title);
  setMeta({ property: 'og:description' }, seo.ogDescription ?? seo.description);
  setMeta({ property: 'og:url' }, seo.ogUrl ?? seo.canonical);
  setMeta({ property: 'og:image' }, seo.ogImage);
  setMeta({ property: 'og:image:alt' }, seo.ogImageAlt);

  setMeta({ name: 'twitter:card' }, 'summary_large_image');
  setMeta({ name: 'twitter:title' }, seo.twitterTitle ?? seo.ogTitle ?? seo.title);
  setMeta({ name: 'twitter:description' }, seo.twitterDescription ?? seo.ogDescription ?? seo.description);
  setMeta({ name: 'twitter:image' }, seo.twitterImage ?? seo.ogImage);

  setJsonLd('page-structured-data', seo.jsonLd);
}
