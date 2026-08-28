import type { QueryClient } from '@tanstack/react-query';
import { theoryKeys } from './query-keys';

export async function invalidateQuestionCaches(queryClient: QueryClient, questionId: string) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: theoryKeys.repository(), refetchType: 'all' }),
    queryClient.invalidateQueries({ queryKey: theoryKeys.question(questionId), refetchType: 'all' }),
    queryClient.invalidateQueries({ queryKey: theoryKeys.questionDetail(questionId), refetchType: 'all' }),
    queryClient.invalidateQueries({ queryKey: theoryKeys.practice(questionId), refetchType: 'all' }),
  ]);
}
