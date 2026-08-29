import 'server-only';

import { and, eq } from 'drizzle-orm';
import { db } from '@/lib/drizzle/client';
import { theoryLibraryItemsInApp, theoryQuestionsInApp } from '@/lib/drizzle/schema';
import { DatabaseError, NotFoundError } from '@/lib/errors';
import { getAuthenticatedUser } from '@/lib/supabase/get-authenticated-user';
import type { SaveBrowseQuestionResponse } from '@/features/theory/browse/api/contracts';

export async function saveBrowseQuestion(questionId: string): Promise<SaveBrowseQuestionResponse> {
  const user = await getAuthenticatedUser();

  try {
    const [question] = await db
      .select({ id: theoryQuestionsInApp.id })
      .from(theoryQuestionsInApp)
      .where(and(eq(theoryQuestionsInApp.id, questionId), eq(theoryQuestionsInApp.isPublic, true)))
      .limit(1);

    if (!question) {
      throw new NotFoundError('questionNotFound');
    }

    await db
      .insert(theoryLibraryItemsInApp)
      .values({
        profileId: user.id,
        questionId,
      })
      .onConflictDoNothing();

    return { questionId };
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw error;
    }
    throw new DatabaseError('DATABASE_ERROR', { cause: error });
  }
}
