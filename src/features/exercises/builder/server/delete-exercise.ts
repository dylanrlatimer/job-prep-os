import 'server-only';

import { and, eq } from 'drizzle-orm';
import { db } from '@/lib/drizzle/client';
import { exerciseAttemptsInApp, exercisesInApp } from '@/lib/drizzle/schema';
import { DatabaseError, ForbiddenError, NotFoundError } from '@/lib/errors';
import { getAuthenticatedUser } from '@/lib/supabase/get-authenticated-user';
import { assertExerciseOwnedBy, exerciseAccess } from '@/features/exercises/server/access';
import type { DeleteExerciseResponse } from '@/features/exercises/builder/api/contracts';

export async function deleteExercise(id: string): Promise<DeleteExerciseResponse> {
  const user = await getAuthenticatedUser();

  try {
    return await db.transaction(async (tx) => {
      const [existing] = await tx
        .select({ id: exercisesInApp.id, ownerProfileId: exercisesInApp.ownerProfileId })
        .from(exercisesInApp)
        .where(eq(exercisesInApp.id, id))
        .limit(1);

      assertExerciseOwnedBy(user.id, existing);

      await tx.delete(exerciseAttemptsInApp).where(eq(exerciseAttemptsInApp.exerciseId, id));
      await tx.delete(exercisesInApp).where(and(eq(exercisesInApp.id, id), exerciseAccess.ownedBy(user.id)));

      return { id };
    });
  } catch (error) {
    if (error instanceof ForbiddenError || error instanceof NotFoundError) {
      throw error;
    }
    throw new DatabaseError('DATABASE_ERROR', { cause: error });
  }
}
