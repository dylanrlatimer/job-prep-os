import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { getServerQueryClient } from '@/lib/query-client';
import { settingsQueryOptions } from '@/features/settings/api/queries';
import { getSettings } from '@/features/settings/server/get-settings';
import SettingsPage from '@/features/settings/components/SettingsPage';

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
