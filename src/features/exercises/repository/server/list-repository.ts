import 'server-only';

import { and, desc, eq, inArray } from 'drizzle-orm';
import { getAuthenticatedUser } from '@/lib/supabase/get-authenticated-user';
import { db } from '@/lib/drizzle/client';
import { exerciseAttemptsInApp, exerciseLibraryItemsInApp, exerciseTopicsInApp, exercisesInApp, topicsInApp } from '@/lib/drizzle/schema';
import { DatabaseError } from '@/lib/errors';
import { exerciseAccess, isExerciseOwnedBy } from '@/features/exercises/server/access';
import type {
  ExerciseAttemptTotals,
  ExerciseTopic,
  GetExerciseRepositoryResponse,
  RepositoryExerciseItem,
} from '@/features/exercises/repository/api/contracts';

const emptyTotals = (): ExerciseAttemptTotals => ({
  incorrect: 0,
  partial: 0,
  correct: 0,
});

export async function listRepository(): Promise<GetExerciseRepositoryResponse> {
  const user = await getAuthenticatedUser();

  try {
    const libraryRows = await db
      .select({
        exerciseId: exerciseLibraryItemsInApp.exerciseId,
        title: exercisesInApp.title,
        ownerProfileId: exercisesInApp.ownerProfileId,
      })
      .from(exerciseLibraryItemsInApp)
      .innerJoin(exercisesInApp, eq(exerciseLibraryItemsInApp.exerciseId, exercisesInApp.id))
      .where(exerciseAccess.inLibrary(user.id))
      .orderBy(desc(exerciseLibraryItemsInApp.createdAt));

    if (libraryRows.length === 0) {
      return { exercises: [], topics: [] };
    }

    const exerciseIds = libraryRows.map((row) => row.exerciseId);

    const topicRows = await db
      .select({
        exerciseId: exerciseTopicsInApp.exerciseId,
        id: topicsInApp.id,
        name: topicsInApp.name,
        slug: topicsInApp.slug,
      })
      .from(exerciseTopicsInApp)
      .innerJoin(topicsInApp, eq(exerciseTopicsInApp.topicId, topicsInApp.id))
      .where(inArray(exerciseTopicsInApp.exerciseId, exerciseIds));

    const attemptRows = await db
      .select({
        exerciseId: exerciseAttemptsInApp.exerciseId,
        result: exerciseAttemptsInApp.result,
      })
      .from(exerciseAttemptsInApp)
      .where(and(eq(exerciseAttemptsInApp.profileId, user.id), inArray(exerciseAttemptsInApp.exerciseId, exerciseIds)));

    const topicsByExercise = new Map<string, ExerciseTopic[]>();
    const topicMap = new Map<string, ExerciseTopic>();

    for (const row of topicRows) {
      const topic = { id: row.id, name: row.name, slug: row.slug };
      topicMap.set(topic.id, topic);

      const existing = topicsByExercise.get(row.exerciseId) ?? [];
      existing.push(topic);
      topicsByExercise.set(row.exerciseId, existing);
    }

    const attemptsByExercise = new Map<string, ExerciseAttemptTotals>();

    for (const row of attemptRows) {
      const totals = attemptsByExercise.get(row.exerciseId) ?? emptyTotals();
      totals[row.result] += 1;
      attemptsByExercise.set(row.exerciseId, totals);
    }

    const exercises: RepositoryExerciseItem[] = libraryRows.map((row) => ({
      id: row.exerciseId,
      title: row.title,
      topics: topicsByExercise.get(row.exerciseId) ?? [],
      attempts: attemptsByExercise.get(row.exerciseId) ?? emptyTotals(),
      canUnsave: !isExerciseOwnedBy(user.id, row.ownerProfileId),
    }));

    const topics = [...topicMap.values()].sort((a, b) => a.name.localeCompare(b.name));

    return { exercises, topics };
  } catch (error) {
    throw new DatabaseError('DATABASE_ERROR', { cause: error });
  }
}
