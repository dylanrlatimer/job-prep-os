import 'server-only';

import { and, eq } from 'drizzle-orm';
import { db } from '@/lib/drizzle/client';
import { theoryAttemptsInApp, theoryQuestionsInApp } from '@/lib/drizzle/schema';
import { DatabaseError, NotFoundError } from '@/lib/errors';
import { assertAdmin } from '@/features/auth/server/assert-admin';
import { questionAccess } from '@/features/theory/server/access';
import type { DeleteSystemQuestionResponse } from '@/features/admin/questions/api/contracts';

export async function deleteSystemQuestion(id: string): Promise<DeleteSystemQuestionResponse> {
  await assertAdmin();

  try {
    return await db.transaction(async (tx) => {
      const [existing] = await tx
        .select({ id: theoryQuestionsInApp.id })
        .from(theoryQuestionsInApp)
        .where(and(eq(theoryQuestionsInApp.id, id), questionAccess.appOwned()))
        .limit(1);

      if (!existing) {
        throw new NotFoundError('questionNotFound');
      }

      await tx.delete(theoryAttemptsInApp).where(eq(theoryAttemptsInApp.questionId, id));
      await tx.delete(theoryQuestionsInApp).where(and(eq(theoryQuestionsInApp.id, id), questionAccess.appOwned()));

      return { id };
    });
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw error;
    }
    throw new DatabaseError('DATABASE_ERROR', { cause: error });
  }
}
