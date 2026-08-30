import 'server-only';

import { and, eq, isNull } from 'drizzle-orm';
import { db } from '@/lib/drizzle/client';
import { theoryQuestionTopicsInApp, theoryQuestionsInApp } from '@/lib/drizzle/schema';
import { DatabaseError, NotFoundError } from '@/lib/errors';
import { assertAdmin } from '@/features/auth/server/assert-admin';
import { validateQuestionInput } from '@/features/theory/builder/server/validate-question-input';
import type { UpdateSystemQuestionInput, UpdateSystemQuestionResponse } from '@/features/admin/questions/api/contracts';

export async function updateSystemQuestion(id: string, input: UpdateSystemQuestionInput): Promise<UpdateSystemQuestionResponse> {
  await assertAdmin();
  await validateQuestionInput(input);

  try {
    return await db.transaction(async (tx) => {
      const [existing] = await tx
        .select({ id: theoryQuestionsInApp.id })
        .from(theoryQuestionsInApp)
        .where(and(eq(theoryQuestionsInApp.id, id), isNull(theoryQuestionsInApp.ownerProfileId)))
        .limit(1);

      if (!existing) {
        throw new NotFoundError('questionNotFound');
      }

      const [updated] = await tx
        .update(theoryQuestionsInApp)
        .set({
          question: input.question,
          answer: input.answer,
          sourceName: input.sourceName,
          sourceUrl: input.sourceUrl,
          isPublic: input.isPublic,
        })
        .where(and(eq(theoryQuestionsInApp.id, id), isNull(theoryQuestionsInApp.ownerProfileId)))
        .returning({ id: theoryQuestionsInApp.id });

      if (!updated) {
        throw new DatabaseError('DATABASE_ERROR');
      }

      await tx.delete(theoryQuestionTopicsInApp).where(eq(theoryQuestionTopicsInApp.questionId, id));

      if (input.topicIds.length > 0) {
        await tx.insert(theoryQuestionTopicsInApp).values(
          input.topicIds.map((topicId) => ({
            questionId: id,
            topicId,
          })),
        );
      }

      return { id: updated.id };
    });
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw error;
    }
    throw new DatabaseError('DATABASE_ERROR', { cause: error });
  }
}
