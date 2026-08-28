import 'server-only';

import { eq } from 'drizzle-orm';
import { db } from '@/lib/drizzle/client';
import { theoryQuestionsInApp } from '@/lib/drizzle/schema';
import { DatabaseError, NotFoundError } from '@/lib/errors';
import { getAuthenticatedUser } from '@/lib/supabase/get-authenticated-user';
import type { PracticeReviewResponse } from '@/features/theory/practice/api/contracts';
import { assertQuestionInLibrary } from '@/features/theory/practice/server/assert-question-in-library';
import { listQuestionAttempts } from '@/features/theory/practice/server/list-question-attempts';

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

    const { attempts, attemptHistory } = await listQuestionAttempts(user.id, id);

    return {
      answer: question.answer,
      attempts,
      attemptHistory,
    };
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw error;
    }
    throw new DatabaseError('DATABASE_ERROR', { cause: error });
  }
}
