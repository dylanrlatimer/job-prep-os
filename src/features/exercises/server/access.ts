import 'server-only';

import { and, eq, isNull } from 'drizzle-orm';
import { db } from '@/lib/drizzle/client';
import { exerciseLibraryItemsInApp, exercisesInApp } from '@/lib/drizzle/schema';
import { ForbiddenError, NotFoundError } from '@/lib/errors';

export const exerciseAccess = {
  public: () => eq(exercisesInApp.isPublic, true),
  ownedBy: (userId: string) => eq(exercisesInApp.ownerProfileId, userId),
  appOwned: () => isNull(exercisesInApp.ownerProfileId),
};

export function isExerciseOwnedBy(userId: string, ownerProfileId: string | null): boolean {
  return ownerProfileId === userId;
}

export function isExerciseAppOwned(ownerProfileId: string | null): boolean {
  return ownerProfileId === null;
}

export function assertExerciseOwnedBy(userId: string, exercise: { ownerProfileId: string | null } | undefined): asserts exercise is { ownerProfileId: string } {
  if (!exercise) {
    throw new NotFoundError('exerciseNotFound');
  }

  if (!isExerciseOwnedBy(userId, exercise.ownerProfileId)) {
    throw new ForbiddenError('exerciseForbidden');
  }
}

export function assertExerciseAppOwned(exercise: { ownerProfileId: string | null } | undefined): void {
  if (!exercise || !isExerciseAppOwned(exercise.ownerProfileId)) {
    throw new NotFoundError('exerciseNotFound');
  }
}

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

export function assertExerciseCanUnsave(userId: string, ownerProfileId: string | null): void {
  if (isExerciseOwnedBy(userId, ownerProfileId)) {
    throw new ForbiddenError('cannotUnsaveOwnedExercise');
  }
}
