import 'server-only';

import { and, desc, eq } from 'drizzle-orm';
import { db } from '@/lib/drizzle/client';
import { theoryAttemptsInApp, theoryQuestionsInApp } from '@/lib/drizzle/schema';
import { DatabaseError, NotFoundError } from '@/lib/errors';
import { getAuthenticatedUser } from '@/lib/supabase/get-authenticated-user';
import type { PracticeReviewResponse } from '@/features/theory/practice/api/contracts';
import type { RepositoryAttemptTotals } from '@/features/theory/repository/api/contracts';
import { assertQuestionInLibrary } from '@/features/theory/practice/server/assert-question-in-library';

const emptyTotals = (): RepositoryAttemptTotals => ({
  incorrect: 0,
  partial: 0,
  correct: 0,
});

export async function getPracticeReview(id: string): Promise<PracticeReviewResponse> {
  const user = await getAuthenticatedUser();
  await assertQuestionInLibrary(user.id, id);

  try {
    const [question] = await db
      .select({ answer: theoryQuestionsInApp.answer })
      .from(theoryQuestionsInApp)
      .where(eq(theoryQuestionsInApp.id, id))
      .limit(1);

    if (!question) {
      throw new NotFoundError('questionNotFound');
    }

    const attemptRows = await db
      .select({
        id: theoryAttemptsInApp.id,
        response: theoryAttemptsInApp.response,
        result: theoryAttemptsInApp.result,
        notes: theoryAttemptsInApp.notes,
        createdAt: theoryAttemptsInApp.createdAt,
      })
      .from(theoryAttemptsInApp)
      .where(and(eq(theoryAttemptsInApp.profileId, user.id), eq(theoryAttemptsInApp.questionId, id)))
      .orderBy(desc(theoryAttemptsInApp.createdAt));

    const attempts = emptyTotals();

    for (const row of attemptRows) {
      attempts[row.result] += 1;
    }

    return {
      answer: question.answer,
      attempts,
      attemptHistory: attemptRows,
    };
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw error;
    }
    throw new DatabaseError('DATABASE_ERROR', { cause: error });
  }
}
