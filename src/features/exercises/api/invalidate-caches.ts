import type { QueryClient } from '@tanstack/react-query';
import { exerciseKeys } from './query-keys';

export function removeExerciseCaches(queryClient: QueryClient, exerciseId: string) {
  queryClient.removeQueries({ queryKey: exerciseKeys.exercise(exerciseId) });
  queryClient.removeQueries({ queryKey: exerciseKeys.exerciseDetail(exerciseId) });
  queryClient.removeQueries({ queryKey: exerciseKeys.practice(exerciseId) });
}

export async function invalidateExerciseCaches(queryClient: QueryClient, exerciseId: string) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: exerciseKeys.repository(), refetchType: 'all' }),
    queryClient.invalidateQueries({ queryKey: exerciseKeys.exercise(exerciseId), refetchType: 'all' }),
    queryClient.invalidateQueries({ queryKey: exerciseKeys.exerciseDetail(exerciseId), refetchType: 'all' }),
    queryClient.invalidateQueries({ queryKey: exerciseKeys.practice(exerciseId), refetchType: 'all' }),
  ]);
}

export async function invalidateExerciseRepositoryCache(queryClient: QueryClient) {
  await queryClient.invalidateQueries({ queryKey: exerciseKeys.repository(), refetchType: 'all' });
}

export async function invalidateExerciseBrowseCaches(queryClient: QueryClient, exerciseId?: string) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: exerciseKeys.browse(), refetchType: 'all' }),
    exerciseId ? queryClient.invalidateQueries({ queryKey: exerciseKeys.browseExercise(exerciseId), refetchType: 'all' }) : Promise.resolve(),
    queryClient.invalidateQueries({ queryKey: exerciseKeys.repository(), refetchType: 'all' }),
  ]);
}
