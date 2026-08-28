import type { Metadata, Viewport } from 'next';
import ClientLayout from './ClientLayout';
import '../globals.css';
import { hasLocale, NextIntlClientProvider } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { getServerQueryClient } from '@/lib/query-client';
import { sessionQueryOptions } from '@/features/auth/api/queries';
import { getSession } from '@/features/auth/server/get-session';

type LayoutProps = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

function assertValidLocale(locale: string): asserts locale is (typeof routing.locales)[number] {
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
}

// TODO: Update metadataBase for production
export async function generateMetadata({ params }: Omit<LayoutProps, 'children'>): Promise<Metadata> {
  const { locale } = await params;
  assertValidLocale(locale);

  const t = await getTranslations({ locale, namespace: 'Metadata' });

  return {
    title: t('title'),
    description: t('description'),
    applicationName: 'JobPrepOS',
  };
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#131312',
  colorScheme: 'dark',
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
      <body className='antialiased'>
        <NextIntlClientProvider>
          <ClientLayout>
            <HydrationBoundary state={dehydrate(queryClient)}>{children}</HydrationBoundary>
          </ClientLayout>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
