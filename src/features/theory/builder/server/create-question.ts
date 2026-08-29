import 'server-only';

import { db } from '@/lib/drizzle/client';
import { theoryLibraryItemsInApp, theoryQuestionTopicsInApp, theoryQuestionsInApp } from '@/lib/drizzle/schema';
import { DatabaseError } from '@/lib/errors';
import { getAuthenticatedUser } from '@/lib/supabase/get-authenticated-user';
import { validateQuestionInput } from '@/features/theory/builder/server/validate-question-input';
import type { CreateQuestionInput, CreateQuestionResponse } from '@/features/theory/builder/api/contracts';

export async function createQuestion(input: CreateQuestionInput): Promise<CreateQuestionResponse> {
  const user = await getAuthenticatedUser();
  await validateQuestionInput(input);

  try {
    return await db.transaction(async (tx) => {
      const [created] = await tx
        .insert(theoryQuestionsInApp)
        .values({
          ownerProfileId: user.id,
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

      await tx
        .insert(theoryLibraryItemsInApp)
        .values({
          profileId: user.id,
          questionId: created.id,
        })
        .onConflictDoNothing();

      return { id: created.id };
    });
  } catch (error) {
    throw new DatabaseError('DATABASE_ERROR', { cause: error });
  }
}
