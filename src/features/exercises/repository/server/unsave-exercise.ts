import 'server-only';

import { and, eq } from 'drizzle-orm';
import { db } from '@/lib/drizzle/client';
import { exerciseLibraryItemsInApp, exercisesInApp } from '@/lib/drizzle/schema';
import { DatabaseError, ForbiddenError, NotFoundError } from '@/lib/errors';
import { getAuthenticatedUser } from '@/lib/supabase/get-authenticated-user';
import type { UnsaveExerciseResponse } from '@/features/exercises/repository/api/contracts';

export async function unsaveExercise(exerciseId: string): Promise<UnsaveExerciseResponse> {
  const user = await getAuthenticatedUser();

  try {
    const [libraryItem] = await db
      .select({
        exerciseId: exerciseLibraryItemsInApp.exerciseId,
        ownerProfileId: exercisesInApp.ownerProfileId,
      })
      .from(exerciseLibraryItemsInApp)
      .innerJoin(exercisesInApp, eq(exerciseLibraryItemsInApp.exerciseId, exercisesInApp.id))
      .where(and(eq(exerciseLibraryItemsInApp.profileId, user.id), eq(exerciseLibraryItemsInApp.exerciseId, exerciseId)))
      .limit(1);

    if (!libraryItem) {
      throw new NotFoundError('exerciseNotInRepository');
    }

    if (libraryItem.ownerProfileId === user.id) {
      throw new ForbiddenError('cannotUnsaveOwnedExercise');
    }

    await db
      .delete(exerciseLibraryItemsInApp)
      .where(and(eq(exerciseLibraryItemsInApp.profileId, user.id), eq(exerciseLibraryItemsInApp.exerciseId, exerciseId)));

    return { exerciseId };
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof ForbiddenError) {
      throw error;
    }
    throw new DatabaseError('DATABASE_ERROR', { cause: error });
  }
}
