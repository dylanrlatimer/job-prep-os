import 'server-only';

import { and, eq } from 'drizzle-orm';
import { db } from '@/lib/drizzle/client';
import { exerciseLibraryItemsInApp, exercisesInApp } from '@/lib/drizzle/schema';
import { DatabaseError, NotFoundError } from '@/lib/errors';
import { getAuthenticatedUser } from '@/lib/supabase/get-authenticated-user';
import { exerciseAccess } from '@/features/exercises/server/access';
import type { SaveExerciseResponse } from '@/features/exercises/browse/api/contracts';

export async function saveExercise(exerciseId: string): Promise<SaveExerciseResponse> {
  const user = await getAuthenticatedUser();

  try {
    const [exercise] = await db
      .select({ id: exercisesInApp.id })
      .from(exercisesInApp)
      .where(and(eq(exercisesInApp.id, exerciseId), exerciseAccess.public()))
      .limit(1);

    if (!exercise) {
      throw new NotFoundError('exerciseNotFound');
    }

    await db
      .insert(exerciseLibraryItemsInApp)
      .values({
        profileId: user.id,
        exerciseId,
      })
      .onConflictDoNothing();

    return { exerciseId };
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw error;
    }
    throw new DatabaseError('DATABASE_ERROR', { cause: error });
  }
}
