import 'server-only';

import { db } from '@/lib/drizzle/client';
import { theoryAttemptsInApp } from '@/lib/drizzle/schema';
import { DatabaseError } from '@/lib/errors';
import { getAuthenticatedUser } from '@/lib/supabase/get-authenticated-user';
import type { CreateAttemptInput, CreateAttemptResponse } from '@/features/theory/practice/api/contracts';
import { assertQuestionInLibrary } from '@/features/theory/practice/server/assert-question-in-library';

export async function createAttempt(questionId: string, input: CreateAttemptInput): Promise<CreateAttemptResponse> {
  const user = await getAuthenticatedUser();
  await assertQuestionInLibrary(user.id, questionId);

  try {
    const [created] = await db
      .insert(theoryAttemptsInApp)
      .values({
        profileId: user.id,
        questionId,
        result: input.result,
        response: input.response,
        notes: input.notes,
      })
      .returning({ id: theoryAttemptsInApp.id });

    if (!created) {
      throw new DatabaseError('DATABASE_ERROR');
    }

    return { id: created.id };
  } catch (error) {
    throw new DatabaseError('DATABASE_ERROR', { cause: error });
  }
}
