import 'server-only';

import { and, desc, eq } from 'drizzle-orm';
import { db } from '@/lib/drizzle/client';
import { exerciseAttemptsInApp } from '@/lib/drizzle/schema';
import type { ExerciseAttemptHistoryItem } from '@/features/exercises/detail/api/contracts';
import type { ExerciseAttemptTotals } from '@/features/exercises/repository/api/contracts';

const emptyTotals = (): ExerciseAttemptTotals => ({
  incorrect: 0,
  partial: 0,
  correct: 0,
});

export async function listExerciseAttempts(profileId: string, exerciseId: string) {
  const attemptRows = await db
    .select({
      id: exerciseAttemptsInApp.id,
      selectedChoiceIds: exerciseAttemptsInApp.selectedChoiceIds,
      result: exerciseAttemptsInApp.result,
      createdAt: exerciseAttemptsInApp.createdAt,
    })
    .from(exerciseAttemptsInApp)
    .where(and(eq(exerciseAttemptsInApp.profileId, profileId), eq(exerciseAttemptsInApp.exerciseId, exerciseId)))
    .orderBy(desc(exerciseAttemptsInApp.createdAt));

  const attempts = emptyTotals();

  for (const row of attemptRows) {
    attempts[row.result] += 1;
  }

  return {
    attempts,
    attemptHistory: attemptRows as ExerciseAttemptHistoryItem[],
  };
}
