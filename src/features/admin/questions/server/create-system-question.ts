import 'server-only';

import { db } from '@/lib/drizzle/client';
import { theoryQuestionTopicsInApp, theoryQuestionsInApp } from '@/lib/drizzle/schema';
import { DatabaseError } from '@/lib/errors';
import { assertAdmin } from '@/features/auth/server/assert-admin';
import { validateQuestionInput } from '@/features/theory/builder/server/validate-question-input';
import type { CreateSystemQuestionInput, CreateSystemQuestionResponse } from '@/features/admin/questions/api/contracts';

export async function createSystemQuestion(input: CreateSystemQuestionInput): Promise<CreateSystemQuestionResponse> {
  await assertAdmin();
  await validateQuestionInput(input);

  try {
    return await db.transaction(async (tx) => {
      const [created] = await tx
        .insert(theoryQuestionsInApp)
        .values({
          ownerProfileId: null,
          question: input.question,
          answer: input.answer,
          sourceName: input.sourceName,
          sourceUrl: input.sourceUrl,
          isPublic: input.isPublic,
        })
        .returning({ id: theoryQuestionsInApp.id });

      if (!created) {
        throw new DatabaseError('DATABASE_ERROR');
      }

      if (input.categoryIds.length > 0) {
        await tx.insert(theoryQuestionTopicsInApp).values(
          input.categoryIds.map((topicId) => ({
            questionId: created.id,
            topicId,
          })),
        );
      }

      return { id: created.id };
    });
  } catch (error) {
    throw new DatabaseError('DATABASE_ERROR', { cause: error });
  }
}
