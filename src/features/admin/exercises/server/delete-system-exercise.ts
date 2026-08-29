import 'server-only';

import { and, eq, isNull } from 'drizzle-orm';
import { db } from '@/lib/drizzle/client';
import { exerciseAttemptsInApp, exercisesInApp } from '@/lib/drizzle/schema';
import { DatabaseError, NotFoundError } from '@/lib/errors';
import { assertAdmin } from '@/features/auth/server/assert-admin';
import type { DeleteSystemExerciseResponse } from '@/features/admin/exercises/api/contracts';

export async function deleteSystemExercise(id: string): Promise<DeleteSystemExerciseResponse> {
  await assertAdmin();

  try {
    return await db.transaction(async (tx) => {
      const [existing] = await tx
        .select({ id: exercisesInApp.id })
        .from(exercisesInApp)
        .where(and(eq(exercisesInApp.id, id), isNull(exercisesInApp.ownerProfileId)))
        .limit(1);

      if (!existing) {
        throw new NotFoundError('exerciseNotFound');
      }

      await tx.delete(exerciseAttemptsInApp).where(eq(exerciseAttemptsInApp.exerciseId, id));
      await tx.delete(exercisesInApp).where(eq(exercisesInApp.id, id));

      return { id };
    });
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw error;
    }
    throw new DatabaseError('DATABASE_ERROR', { cause: error });
  }
}
