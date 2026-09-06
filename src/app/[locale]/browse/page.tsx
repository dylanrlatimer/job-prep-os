import { Suspense } from 'react';
import { getTranslations } from 'next-intl/server';
import { hasLocale } from 'next-intl';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import AppShell from '@/common/components/AppShell';
import ListPageSkeleton from '@/common/components/ListPageSkeleton';
import BrowsePage from '@/features/theory/browse/components/BrowsePage';
import { absoluteUrl, buildPageMetadata } from '@/lib/seo';
import type { Metadata } from 'next';

type PageProps = {
  params: Promise<{ locale: string }>;
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

export default async function BrowsePageEntry({ params }: PageProps) {
  const { locale } = await params;
  assertValidLocale(locale);

  const t = await getTranslations({ locale, namespace: 'Metadata' });
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
      <Suspense
        fallback={
          <AppShell>
            <ListPageSkeleton />
          </AppShell>
        }>
        <BrowsePage />
      </Suspense>
    </>
  );
}
