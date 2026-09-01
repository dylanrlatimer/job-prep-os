import { getTranslations } from 'next-intl/server';
import { hasLocale } from 'next-intl';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import BrowsePage from '@/features/theory/browse/components/BrowsePage';
import { parseBrowseKind } from '@/features/theory/browse/lib/browse-filters';
import { absoluteUrl, buildPageMetadata } from '@/lib/seo';
import type { Metadata } from 'next';

type PageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ kind?: string }>;
};

function assertValidLocale(locale: string): asserts locale is (typeof routing.locales)[number] {
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
}

export async function generateMetadata({ params }: Pick<PageProps, 'params'>): Promise<Metadata> {
  const { locale } = await params;
  assertValidLocale(locale);

  const t = await getTranslations({ locale, namespace: 'Metadata' });

  return buildPageMetadata({
    locale,
    title: t('browseTitle'),
    description: t('browseDescription'),
    pathname: '/browse',
    index: true,
    absoluteTitle: true,
  });
}

export default async function BrowsePageEntry({ params, searchParams }: PageProps) {
  const { locale } = await params;
  assertValidLocale(locale);

  const t = await getTranslations({ locale, namespace: 'Metadata' });
  const query = await searchParams;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: t('siteName'),
    url: absoluteUrl(locale, '/browse'),
    description: t('browseDescription'),
    inLanguage: locale,
  };

  return (
    <>
      <script type='application/ld+json' dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <BrowsePage initialKind={parseBrowseKind(query.kind)} />
    </>
  );
}
