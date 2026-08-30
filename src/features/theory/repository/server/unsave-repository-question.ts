import 'server-only';

import { and, eq } from 'drizzle-orm';
import { db } from '@/lib/drizzle/client';
import { theoryLibraryItemsInApp, theoryQuestionsInApp } from '@/lib/drizzle/schema';
import { DatabaseError, ForbiddenError, NotFoundError } from '@/lib/errors';
import { getAuthenticatedUser } from '@/lib/supabase/get-authenticated-user';
import { assertQuestionCanUnsave } from '@/features/theory/server/access';
import type { UnsaveRepositoryQuestionResponse } from '@/features/theory/repository/api/contracts';

export async function unsaveRepositoryQuestion(questionId: string): Promise<UnsaveRepositoryQuestionResponse> {
  const user = await getAuthenticatedUser();

  try {
    const [libraryItem] = await db
      .select({
        questionId: theoryLibraryItemsInApp.questionId,
        ownerProfileId: theoryQuestionsInApp.ownerProfileId,
      })
      .from(theoryLibraryItemsInApp)
      .innerJoin(theoryQuestionsInApp, eq(theoryLibraryItemsInApp.questionId, theoryQuestionsInApp.id))
      .where(and(eq(theoryLibraryItemsInApp.profileId, user.id), eq(theoryLibraryItemsInApp.questionId, questionId)))
      .limit(1);

    if (!libraryItem) {
      throw new NotFoundError('questionNotInRepository');
    }

    assertQuestionCanUnsave(user.id, libraryItem.ownerProfileId);

    await db.delete(theoryLibraryItemsInApp).where(and(eq(theoryLibraryItemsInApp.profileId, user.id), eq(theoryLibraryItemsInApp.questionId, questionId)));

    return { questionId };
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof ForbiddenError) {
      throw error;
    }
    throw new DatabaseError('DATABASE_ERROR', { cause: error });
  }
}
