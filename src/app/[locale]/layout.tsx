import type { Metadata, Viewport } from 'next';
import ClientLayout from './ClientLayout';
import { Inter } from 'next/font/google';
import '../globals.css';
import { hasLocale, NextIntlClientProvider } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { getServerQueryClient } from '@/lib/query-client';
import { sessionQueryOptions } from '@/features/auth/api/queries';
import { getSession } from '@/features/auth/server/get-session';

const inter = Inter({ subsets: ['latin'] });

type LayoutProps = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

const OG_LOCALE_BY_APP_LOCALE = {
  en: 'en_US',
  fr: 'fr_FR',
} as const;

function assertValidLocale(locale: string): asserts locale is (typeof routing.locales)[number] {
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
}

// TODO: Update metadata
export async function generateMetadata({ params }: Omit<LayoutProps, 'children'>): Promise<Metadata> {
  const { locale } = await params;
  assertValidLocale(locale);

  const t = await getTranslations({ locale, namespace: 'Metadata' });

  return {
    title: t('title'),
    description: t('description'),
    icons: {
      icon: '/favicon.ico',
    },
    metadataBase: new URL('http://localhost:3000'),
    keywords: ['latimer', 'nextjs', 'template', 'starter project', 'react', 'typescript'],
    authors: [{ name: 'Dylan Latimer' }],
    creator: 'Dylan Latimer',
    publisher: 'Dylan Latimer',
    applicationName: 'Latimer NextJS Template',
    category: 'Development',
    robots: {
      index: true,
      follow: true,
      nocache: false,
    },
    openGraph: {
      title: t('ogTitle'),
      description: t('ogDescription'),
      url: 'http://localhost:3000',
      siteName: 'Latimer NextJS Template',
      type: 'website',
      locale: OG_LOCALE_BY_APP_LOCALE[locale],
      images: [
        {
          url: '/og-image.png',
          width: 1200,
          height: 630,
          alt: 'Latimer NextJS Template',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: t('twitterTitle'),
      description: t('twitterDescription'),
      site: '@dylanlatimer',
      images: [
        {
          url: '/og-image.png',
          width: 1200,
          height: 630,
          alt: 'Latimer NextJS Template',
        },
      ],
    },
  };
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#fafafa',
  colorScheme: 'light',
};

export default async function RootLayout({ children, params }: LayoutProps) {
  const { locale } = await params;
  assertValidLocale(locale);

  const queryClient = getServerQueryClient();
  await queryClient.prefetchQuery({
    ...sessionQueryOptions,
    queryFn: getSession,
  });

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={`${inter.className} antialiased`}>
        <NextIntlClientProvider>
          <ClientLayout>
            <HydrationBoundary state={dehydrate(queryClient)}>{children}</HydrationBoundary>
          </ClientLayout>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
