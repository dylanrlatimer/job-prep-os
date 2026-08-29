import type { QueryClient } from '@tanstack/react-query';
import { theoryKeys } from './query-keys';

export function removeQuestionCaches(queryClient: QueryClient, questionId: string) {
  queryClient.removeQueries({ queryKey: theoryKeys.question(questionId) });
  queryClient.removeQueries({ queryKey: theoryKeys.questionDetail(questionId) });
  queryClient.removeQueries({ queryKey: theoryKeys.practice(questionId) });
}

export async function invalidateQuestionCaches(queryClient: QueryClient, questionId: string) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: theoryKeys.repository(), refetchType: 'all' }),
    queryClient.invalidateQueries({ queryKey: theoryKeys.question(questionId), refetchType: 'all' }),
    queryClient.invalidateQueries({ queryKey: theoryKeys.questionDetail(questionId), refetchType: 'all' }),
    queryClient.invalidateQueries({ queryKey: theoryKeys.practice(questionId), refetchType: 'all' }),
  ]);
}

export async function invalidateRepositoryCache(queryClient: QueryClient) {
  await queryClient.invalidateQueries({ queryKey: theoryKeys.repository(), refetchType: 'all' });
}
