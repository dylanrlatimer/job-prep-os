import 'server-only';

import { desc, eq, inArray } from 'drizzle-orm';
import { db } from '@/lib/drizzle/client';
import { exerciseLibraryItemsInApp, exerciseTopicsInApp, exercisesInApp, topicsInApp } from '@/lib/drizzle/schema';
import { DatabaseError } from '@/lib/errors';
import { getOptionalUser } from '@/lib/supabase/get-authenticated-user';
import { exerciseAccess, isExerciseAppOwned } from '@/features/exercises/server/access';
import type { BrowseExerciseItem, GetBrowseExercisesResponse } from '@/features/exercises/browse/api/contracts';
import type { ExerciseTopic } from '@/features/exercises/repository/api/contracts';

export async function listBrowse(): Promise<GetBrowseExercisesResponse> {
  const user = await getOptionalUser();

  try {
    const exerciseRows = await db
      .select({
        id: exercisesInApp.id,
        title: exercisesInApp.title,
        ownerProfileId: exercisesInApp.ownerProfileId,
        createdAt: exercisesInApp.createdAt,
      })
      .from(exercisesInApp)
      .where(exerciseAccess.public())
      .orderBy(desc(exercisesInApp.createdAt));

    if (exerciseRows.length === 0) {
      return { exercises: [], topics: [] };
    }

    const exerciseIds = exerciseRows.map((row) => row.id);

    const savedRows = user
      ? await db.select({ exerciseId: exerciseLibraryItemsInApp.exerciseId }).from(exerciseLibraryItemsInApp).where(exerciseAccess.inLibrary(user.id))
      : [];

    const savedExerciseIds = new Set(savedRows.map((row) => row.exerciseId));

    const topicRows = await db
      .select({
        exerciseId: exerciseTopicsInApp.exerciseId,
        id: topicsInApp.id,
        name: topicsInApp.name,
        slug: topicsInApp.slug,
        iconKey: topicsInApp.iconKey,
      })
      .from(exerciseTopicsInApp)
      .innerJoin(topicsInApp, eq(exerciseTopicsInApp.topicId, topicsInApp.id))
      .where(inArray(exerciseTopicsInApp.exerciseId, exerciseIds));

    const topicsByExercise = new Map<string, ExerciseTopic[]>();
    const topicMap = new Map<string, ExerciseTopic>();

    for (const row of topicRows) {
      const topic = { id: row.id, name: row.name, slug: row.slug, iconKey: row.iconKey };
      topicMap.set(topic.id, topic);

      const existing = topicsByExercise.get(row.exerciseId) ?? [];
      existing.push(topic);
      topicsByExercise.set(row.exerciseId, existing);
    }

    const exercises: BrowseExerciseItem[] = exerciseRows.map((row) => ({
      id: row.id,
      title: row.title,
      topics: topicsByExercise.get(row.id) ?? [],
      isSaved: savedExerciseIds.has(row.id),
      isSystem: isExerciseAppOwned(row.ownerProfileId),
      createdAt: row.createdAt,
    }));

    const topics = [...topicMap.values()].sort((a, b) => a.name.localeCompare(b.name));

    return { exercises, topics };
  } catch (error) {
    throw new DatabaseError('DATABASE_ERROR', { cause: error });
  }
}
