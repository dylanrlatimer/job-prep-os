import type { QueryClient } from '@tanstack/react-query';
import { authKeys } from '@/features/auth/api/query-keys';

export function resetClientSession(queryClient: QueryClient): void {
  queryClient.clear();
  void queryClient.invalidateQueries({ queryKey: authKeys.session() });
}
