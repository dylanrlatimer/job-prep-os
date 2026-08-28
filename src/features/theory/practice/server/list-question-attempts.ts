import 'server-only';

import { and, desc, eq } from 'drizzle-orm';
import { db } from '@/lib/drizzle/client';
import { theoryAttemptsInApp } from '@/lib/drizzle/schema';
import type { PracticeAttempt } from '@/features/theory/practice/api/contracts';
import type { RepositoryAttemptTotals } from '@/features/theory/repository/api/contracts';

const emptyTotals = (): RepositoryAttemptTotals => ({
  incorrect: 0,
  partial: 0,
  correct: 0,
});

export async function listQuestionAttempts(profileId: string, questionId: string) {
  const attemptRows = await db
    .select({
      id: theoryAttemptsInApp.id,
      response: theoryAttemptsInApp.response,
      result: theoryAttemptsInApp.result,
      notes: theoryAttemptsInApp.notes,
      createdAt: theoryAttemptsInApp.createdAt,
    })
    .from(theoryAttemptsInApp)
    .where(and(eq(theoryAttemptsInApp.profileId, profileId), eq(theoryAttemptsInApp.questionId, questionId)))
    .orderBy(desc(theoryAttemptsInApp.createdAt));

  const attempts = emptyTotals();

  for (const row of attemptRows) {
    attempts[row.result] += 1;
  }

  return {
    attempts,
    attemptHistory: attemptRows as PracticeAttempt[],
  };
}
