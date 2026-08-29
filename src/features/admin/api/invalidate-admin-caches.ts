import type { QueryClient } from '@tanstack/react-query';
import { adminKeys } from '@/features/admin/api/query-keys';
import { theoryKeys } from '@/features/theory/api/query-keys';

export async function invalidateBrowseCaches(queryClient: QueryClient, questionId?: string) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: theoryKeys.browse(), refetchType: 'all' }),
    questionId ? queryClient.invalidateQueries({ queryKey: theoryKeys.browseQuestion(questionId), refetchType: 'all' }) : Promise.resolve(),
    queryClient.invalidateQueries({ queryKey: theoryKeys.repository(), refetchType: 'all' }),
  ]);
}

export async function invalidateAdminQuestionCaches(queryClient: QueryClient, questionId?: string) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: adminKeys.systemQuestions(), refetchType: 'all' }),
    questionId ? queryClient.invalidateQueries({ queryKey: adminKeys.systemQuestion(questionId), refetchType: 'all' }) : Promise.resolve(),
    invalidateBrowseCaches(queryClient),
  ]);
}

export async function invalidateAdminCategoryCaches(queryClient: QueryClient, categoryId?: string) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: adminKeys.categories(), refetchType: 'all' }),
    categoryId ? queryClient.invalidateQueries({ queryKey: adminKeys.category(categoryId), refetchType: 'all' }) : Promise.resolve(),
    queryClient.invalidateQueries({ queryKey: theoryKeys.builderMetadata(), refetchType: 'all' }),
    queryClient.invalidateQueries({ queryKey: adminKeys.systemQuestions(), refetchType: 'all' }),
    queryClient.invalidateQueries({ queryKey: theoryKeys.browse(), refetchType: 'all' }),
    queryClient.invalidateQueries({ queryKey: theoryKeys.repository(), refetchType: 'all' }),
  ]);
}
