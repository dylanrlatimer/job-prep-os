import 'server-only';

import { and, eq } from 'drizzle-orm';
import { db } from '@/lib/drizzle/client';
import { exerciseChoicesInApp, exerciseTopicsInApp, exercisesInApp } from '@/lib/drizzle/schema';
import { DatabaseError, ForbiddenError, NotFoundError } from '@/lib/errors';
import { getAuthenticatedUser } from '@/lib/supabase/get-authenticated-user';
import { assertExerciseOwnedBy, exerciseAccess } from '@/features/exercises/server/access';
import { validateExerciseInput } from '@/features/exercises/builder/server/validate-exercise-input';
import type { UpdateExerciseInput, UpdateExerciseResponse } from '@/features/exercises/builder/api/contracts';

export async function updateExercise(id: string, input: UpdateExerciseInput): Promise<UpdateExerciseResponse> {
  const user = await getAuthenticatedUser();
  await validateExerciseInput(input);

  try {
    return await db.transaction(async (tx) => {
      const [existing] = await tx.select({ ownerProfileId: exercisesInApp.ownerProfileId }).from(exercisesInApp).where(eq(exercisesInApp.id, id)).limit(1);

      assertExerciseOwnedBy(user.id, existing);

      const [updated] = await tx
        .update(exercisesInApp)
        .set({
          title: input.title,
          prompt: input.prompt,
          explanation: input.explanation,
          sourceName: input.sourceName,
          sourceUrl: input.sourceUrl,
          isPublic: input.isPublic,
          allowMultiple: input.allowMultiple,
        })
        .where(and(eq(exercisesInApp.id, id), exerciseAccess.ownedBy(user.id)))
        .returning({ id: exercisesInApp.id });

      if (!updated) {
        throw new DatabaseError('DATABASE_ERROR');
      }

      await tx.delete(exerciseTopicsInApp).where(eq(exerciseTopicsInApp.exerciseId, id));

      if (input.topicIds.length > 0) {
        await tx.insert(exerciseTopicsInApp).values(
          input.topicIds.map((topicId) => ({
            exerciseId: id,
            topicId,
          })),
        );
      }

      await tx.delete(exerciseChoicesInApp).where(eq(exerciseChoicesInApp.exerciseId, id));

      await tx.insert(exerciseChoicesInApp).values(
        input.choices.map((choice, index) => ({
          exerciseId: id,
          content: choice.content,
          isCorrect: choice.isCorrect,
          position: index,
        })),
      );

      return { id: updated.id };
    });
  } catch (error) {
    if (error instanceof ForbiddenError || error instanceof NotFoundError) {
      throw error;
    }
    throw new DatabaseError('DATABASE_ERROR', { cause: error });
  }
}
