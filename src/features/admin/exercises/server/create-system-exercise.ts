import 'server-only';

import { db } from '@/lib/drizzle/client';
import { exerciseChoicesInApp, exerciseTopicsInApp, exercisesInApp } from '@/lib/drizzle/schema';
import { DatabaseError } from '@/lib/errors';
import { assertAdmin } from '@/features/auth/server/assert-admin';
import { validateExerciseInput } from '@/features/exercises/builder/server/validate-exercise-input';
import type { CreateSystemExerciseInput, CreateSystemExerciseResponse } from '@/features/admin/exercises/api/contracts';

export async function createSystemExercise(input: CreateSystemExerciseInput): Promise<CreateSystemExerciseResponse> {
  await assertAdmin();
  await validateExerciseInput(input);

  try {
    return await db.transaction(async (tx) => {
      const [created] = await tx
        .insert(exercisesInApp)
        .values({
          ownerProfileId: null,
          title: input.title,
          prompt: input.prompt,
          explanation: input.explanation,
          sourceName: input.sourceName,
          sourceUrl: input.sourceUrl,
          isPublic: input.isPublic,
          allowMultiple: input.allowMultiple,
        })
        .returning({ id: exercisesInApp.id });

      if (!created) {
        throw new DatabaseError('DATABASE_ERROR');
      }

      if (input.topicIds.length > 0) {
        await tx.insert(exerciseTopicsInApp).values(
          input.topicIds.map((topicId) => ({
            exerciseId: created.id,
            topicId,
          })),
        );
      }

      await tx.insert(exerciseChoicesInApp).values(
        input.choices.map((choice, index) => ({
          exerciseId: created.id,
          content: choice.content,
          isCorrect: choice.isCorrect,
          position: index,
        })),
      );

      return { id: created.id };
    });
  } catch (error) {
    throw new DatabaseError('DATABASE_ERROR', { cause: error });
  }
}
