import type { MetadataRoute } from 'next';
import { languages, paths, languageAlternates, localizedPath, siteUrl } from '../lib/catalog';

// Only canonical localized URLs are listed; `/` and `/?lang=` redirect.
export default function sitemap(): MetadataRoute.Sitemap {
 const homepages = languages.map(lang => ({url:siteUrl+localizedPath(lang),changeFrequency:'weekly' as const,priority:1,alternates:{languages:languageAlternates('')}}));
 return [...homepages,...languages.flatMap(lang=>paths.map(path=>({url:siteUrl+localizedPath(lang,path),alternates:{languages:languageAlternates(path)}})))];
}
