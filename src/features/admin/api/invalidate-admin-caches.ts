import type { QueryClient } from '@tanstack/react-query';
import { adminKeys } from '@/features/admin/api/query-keys';
import { invalidateExerciseBrowseCaches } from '@/features/exercises/api/invalidate-caches';
import { exerciseKeys } from '@/features/exercises/api/query-keys';
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

export async function invalidateAdminExerciseCaches(queryClient: QueryClient, exerciseId?: string) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: adminKeys.systemExercises(), refetchType: 'all' }),
    exerciseId ? queryClient.invalidateQueries({ queryKey: adminKeys.systemExercise(exerciseId), refetchType: 'all' }) : Promise.resolve(),
    invalidateExerciseBrowseCaches(queryClient, exerciseId),
  ]);
}

export async function invalidateAdminTopicCaches(queryClient: QueryClient, topicId?: string) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: adminKeys.topics(), refetchType: 'all' }),
    topicId ? queryClient.invalidateQueries({ queryKey: adminKeys.topic(topicId), refetchType: 'all' }) : Promise.resolve(),
    queryClient.invalidateQueries({ queryKey: theoryKeys.builderMetadata(), refetchType: 'all' }),
    queryClient.invalidateQueries({ queryKey: exerciseKeys.builderMetadata(), refetchType: 'all' }),
    queryClient.invalidateQueries({ queryKey: adminKeys.systemQuestions(), refetchType: 'all' }),
    queryClient.invalidateQueries({ queryKey: adminKeys.systemExercises(), refetchType: 'all' }),
    queryClient.invalidateQueries({ queryKey: theoryKeys.browse(), refetchType: 'all' }),
    queryClient.invalidateQueries({ queryKey: theoryKeys.repository(), refetchType: 'all' }),
    invalidateExerciseBrowseCaches(queryClient),
  ]);
}
