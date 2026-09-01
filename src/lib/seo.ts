import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { getPathname } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';

export type AppLocale = (typeof routing.locales)[number];

const ogLocales: Record<AppLocale, string> = {
  en: 'en_CA',
  fr: 'fr_CA',
};

export function getAppUrl(): string {
  const raw = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '');
  if (raw) {
    return raw;
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('NEXT_PUBLIC_APP_URL is not set');
  }

  return 'http://localhost:3000';
}

export function localePath(locale: string, href: string): string {
  return getPathname({ locale, href });
}

export function absoluteUrl(locale: string, href: string): string {
  return `${getAppUrl()}${localePath(locale, href)}`;
}

export function localeAlternates(href: string): Record<string, string> {
  const languages: Record<string, string> = {};

  for (const locale of routing.locales) {
    languages[locale] = absoluteUrl(locale, href);
  }

  languages['x-default'] = absoluteUrl(routing.defaultLocale, href);
  return languages;
}

type BuildPageMetadataInput = {
  locale: string;
  title: string;
  description: string;
  pathname: string;
  index?: boolean;
  absoluteTitle?: boolean;
};

export function buildPageMetadata({ locale, title, description, pathname, index = false, absoluteTitle = false }: BuildPageMetadataInput): Metadata {
  const url = absoluteUrl(locale, pathname);
  const ogLocale = ogLocales[locale as AppLocale] ?? locale;
  const alternateLocale = routing.locales.filter((item) => item !== locale).map((item) => ogLocales[item]);

  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: index
      ? {
          canonical: url,
          languages: localeAlternates(pathname),
        }
      : undefined,
    openGraph: {
      title,
      description,
      url: index ? url : undefined,
      locale: ogLocale,
      alternateLocale,
      siteName: 'JobPrepOS',
      type: 'website',
    },
    twitter: {
      card: 'summary',
      title,
      description,
    },
    robots: index ? { index: true, follow: true } : { index: false, follow: false },
  };
}

export async function sectionTitleMetadata(locale: string, key: string): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'Metadata' });
  return { title: t(key) };
}
