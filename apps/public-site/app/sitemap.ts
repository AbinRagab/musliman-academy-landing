import type { MetadataRoute } from 'next';
import { languages, paths, alternateUrls, siteUrl } from '../lib/catalog';
export default function sitemap(): MetadataRoute.Sitemap {
 return [{url:siteUrl+'/',changeFrequency:'weekly',priority:1},...languages.flatMap(lang=>paths.map(path=>({url:`${siteUrl}/${lang}/${path}`,alternates:{languages:alternateUrls(path)}})))];
}
