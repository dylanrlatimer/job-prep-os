import type { MetadataRoute } from 'next';
import { routing } from '@/i18n/routing';
import { absoluteUrl, localeAlternates } from '@/lib/seo';

export default function sitemap(): MetadataRoute.Sitemap {
  const languages = localeAlternates('/browse');

  return routing.locales.map((locale) => ({
    url: absoluteUrl(locale, '/browse'),
    alternates: {
      languages,
    },
  }));
}
