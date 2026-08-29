import 'server-only';

import { and, eq, isNotNull } from 'drizzle-orm';
import { db } from '@/lib/drizzle/client';
import { theoryAttemptsInApp, theoryQuestionsInApp } from '@/lib/drizzle/schema';
import { DatabaseError, ForbiddenError, NotFoundError } from '@/lib/errors';
import { getAuthenticatedUser } from '@/lib/supabase/get-authenticated-user';
import type { DeleteQuestionResponse } from '@/features/theory/builder/api/contracts';

export async function deleteQuestion(id: string): Promise<DeleteQuestionResponse> {
  const user = await getAuthenticatedUser();

  try {
    return await db.transaction(async (tx) => {
      const [existing] = await tx
        .select({ id: theoryQuestionsInApp.id, ownerProfileId: theoryQuestionsInApp.ownerProfileId })
        .from(theoryQuestionsInApp)
        .where(and(eq(theoryQuestionsInApp.id, id), isNotNull(theoryQuestionsInApp.ownerProfileId)))
        .limit(1);

      if (!existing) {
        throw new NotFoundError('questionNotFound');
      }

      if (existing.ownerProfileId !== user.id) {
        throw new ForbiddenError('questionForbidden');
      }

      await tx.delete(theoryAttemptsInApp).where(eq(theoryAttemptsInApp.questionId, id));
      await tx.delete(theoryQuestionsInApp).where(eq(theoryQuestionsInApp.id, id));

      return { id };
    });
  } catch (error) {
    if (error instanceof ForbiddenError || error instanceof NotFoundError) {
      throw error;
    }
    throw new DatabaseError('DATABASE_ERROR', { cause: error });
  }
}
