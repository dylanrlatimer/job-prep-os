import { queryOptions } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api-client';
import { authKeys } from './query-keys';
import type { SessionResponse } from './contracts';

export const sessionQueryOptions = queryOptions({
  queryKey: authKeys.session(),
  queryFn: () => apiRequest<SessionResponse>('/api/auth/session'),
});
