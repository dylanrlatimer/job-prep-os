import type { Metadata } from 'next';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { getServerQueryClient } from '@/lib/query-client';
import { settingsQueryOptions } from '@/features/settings/api/queries';
import { getSettings } from '@/features/settings/server/get-settings';
import SettingsPage from '@/features/settings/components/SettingsPage';
import { sectionTitleMetadata } from '@/lib/seo';

type PageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  return sectionTitleMetadata(locale, 'pages.settings');
}

export default async function SettingsRoute() {
  const queryClient = getServerQueryClient();
  await queryClient.prefetchQuery({
    ...settingsQueryOptions,
    queryFn: getSettings,
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <SettingsPage />
    </HydrationBoundary>
  );
}
