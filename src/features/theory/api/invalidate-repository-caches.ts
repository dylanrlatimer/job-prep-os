import type { QueryClient } from '@tanstack/react-query';
import { invalidateBrowseCaches } from '@/features/admin/api/invalidate-admin-caches';
import { theoryKeys } from './query-keys';

export async function invalidateRepositoryCaches(queryClient: QueryClient, questionId?: string) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: theoryKeys.repository(), refetchType: 'all' }),
    invalidateBrowseCaches(queryClient, questionId),
    questionId ? queryClient.invalidateQueries({ queryKey: theoryKeys.questionDetail(questionId), refetchType: 'all' }) : Promise.resolve(),
  ]);
}
