import 'server-only';

import { and, eq } from 'drizzle-orm';
import { db } from '@/lib/drizzle/client';
import { exerciseLibraryItemsInApp } from '@/lib/drizzle/schema';
import { NotFoundError } from '@/lib/errors';

export async function assertExerciseInLibrary(profileId: string, exerciseId: string): Promise<void> {
  const [libraryItem] = await db
    .select({ exerciseId: exerciseLibraryItemsInApp.exerciseId })
    .from(exerciseLibraryItemsInApp)
    .where(and(eq(exerciseLibraryItemsInApp.profileId, profileId), eq(exerciseLibraryItemsInApp.exerciseId, exerciseId)))
    .limit(1);

  if (!libraryItem) {
    throw new NotFoundError('exerciseNotInLibrary');
  }
}
