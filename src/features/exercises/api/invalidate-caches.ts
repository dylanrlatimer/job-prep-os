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

type AttemptResult = 'incorrect' | 'partial' | 'correct';

type AttemptTotals = {
  incorrect: number;
  partial: number;
  correct: number;
};

function bumpAttemptTotals(totals: AttemptTotals, result: AttemptResult): AttemptTotals {
  return {
    ...totals,
    [result]: totals[result] + 1,
  };
}

/** Keep list/detail/practice attempt totals in sync immediately after a graded submit. */
export function applyExerciseAttemptToCaches(
  queryClient: QueryClient,
  exerciseId: string,
  attempt: {
    id: string;
    result: AttemptResult;
    selectedChoiceIds: string[];
    createdAt?: string;
  },
) {
  const createdAt = attempt.createdAt ?? new Date().toISOString();

  queryClient.setQueryData<{ exercises: Array<{ id: string; attempts: AttemptTotals }> }>(exerciseKeys.repository(), (current) => {
    if (!current) return current;
    return {
      ...current,
      exercises: current.exercises.map((exercise) =>
        exercise.id === exerciseId ? { ...exercise, attempts: bumpAttemptTotals(exercise.attempts, attempt.result) } : exercise,
      ),
    };
  });

  queryClient.setQueryData<{
    attempts: AttemptTotals;
    attemptHistory: Array<{ id: string; result: AttemptResult; createdAt: string }>;
  }>(exerciseKeys.practice(exerciseId), (current) => {
    if (!current) return current;
    return {
      ...current,
      attempts: bumpAttemptTotals(current.attempts, attempt.result),
      attemptHistory: [{ id: attempt.id, result: attempt.result, createdAt }, ...current.attemptHistory],
    };
  });

  queryClient.setQueryData<{
    attempts: AttemptTotals;
    attemptHistory: Array<{ id: string; selectedChoiceIds: string[]; result: AttemptResult; createdAt: string }>;
  }>(exerciseKeys.exerciseDetail(exerciseId), (current) => {
    if (!current) return current;
    return {
      ...current,
      attempts: bumpAttemptTotals(current.attempts, attempt.result),
      attemptHistory: [
        {
          id: attempt.id,
          selectedChoiceIds: attempt.selectedChoiceIds,
          result: attempt.result,
          createdAt,
        },
        ...current.attemptHistory,
      ],
    };
  });
}
