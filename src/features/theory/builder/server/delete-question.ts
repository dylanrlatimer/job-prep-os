import 'server-only';

import { and, eq } from 'drizzle-orm';
import { db } from '@/lib/drizzle/client';
import { theoryAttemptsInApp, theoryQuestionsInApp } from '@/lib/drizzle/schema';
import { DatabaseError, ForbiddenError, NotFoundError } from '@/lib/errors';
import { getAuthenticatedUser } from '@/lib/supabase/get-authenticated-user';
import { assertQuestionOwnedBy, questionAccess } from '@/features/theory/server/access';
import type { DeleteQuestionResponse } from '@/features/theory/builder/api/contracts';

export async function deleteQuestion(id: string): Promise<DeleteQuestionResponse> {
  const user = await getAuthenticatedUser();

  try {
    return await db.transaction(async (tx) => {
      const [existing] = await tx
        .select({ id: theoryQuestionsInApp.id, ownerProfileId: theoryQuestionsInApp.ownerProfileId })
        .from(theoryQuestionsInApp)
        .where(eq(theoryQuestionsInApp.id, id))
        .limit(1);

      assertQuestionOwnedBy(user.id, existing);

      await tx.delete(theoryAttemptsInApp).where(eq(theoryAttemptsInApp.questionId, id));
      await tx.delete(theoryQuestionsInApp).where(and(eq(theoryQuestionsInApp.id, id), questionAccess.ownedBy(user.id)));

      return { id };
    });
  } catch (error) {
    if (error instanceof ForbiddenError || error instanceof NotFoundError) {
      throw error;
    }
    throw new DatabaseError('DATABASE_ERROR', { cause: error });
  }
}
