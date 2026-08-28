import { queryOptions } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api-client';
import { settingsKeys } from './query-keys';
import type { SettingsResponse } from './contracts';

export const settingsQueryOptions = queryOptions({
  queryKey: settingsKeys.detail(),
  queryFn: () => apiRequest<SettingsResponse>('/api/settings'),
});
