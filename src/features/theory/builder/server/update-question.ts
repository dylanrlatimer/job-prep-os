import 'server-only';

import { and, eq } from 'drizzle-orm';
import { db } from '@/lib/drizzle/client';
import { theoryQuestionTopicsInApp, theoryQuestionsInApp } from '@/lib/drizzle/schema';
import { DatabaseError, ForbiddenError, NotFoundError } from '@/lib/errors';
import { getAuthenticatedUser } from '@/lib/supabase/get-authenticated-user';
import { validateQuestionInput } from '@/features/theory/builder/server/validate-question-input';
import type { UpdateQuestionInput, UpdateQuestionResponse } from '@/features/theory/builder/api/contracts';

export async function updateQuestion(id: string, input: UpdateQuestionInput): Promise<UpdateQuestionResponse> {
  const user = await getAuthenticatedUser();
  await validateQuestionInput(input);

  try {
    return await db.transaction(async (tx) => {
      const [existing] = await tx
        .select({ ownerProfileId: theoryQuestionsInApp.ownerProfileId })
        .from(theoryQuestionsInApp)
        .where(eq(theoryQuestionsInApp.id, id))
        .limit(1);

      if (!existing) {
        throw new NotFoundError('questionNotFound');
      }

      if (existing.ownerProfileId !== user.id) {
        throw new ForbiddenError('questionForbidden');
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
        .where(and(eq(theoryQuestionsInApp.id, id), eq(theoryQuestionsInApp.ownerProfileId, user.id)))
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
    if (error instanceof ForbiddenError || error instanceof NotFoundError) {
      throw error;
    }
    throw new DatabaseError('DATABASE_ERROR', { cause: error });
  }
}
