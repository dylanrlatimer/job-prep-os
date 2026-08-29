import 'server-only';

import { desc, eq, inArray } from 'drizzle-orm';
import { db } from '@/lib/drizzle/client';
import {
  exerciseLibraryItemsInApp,
  exerciseTopicsInApp,
  exercisesInApp,
  topicsInApp,
} from '@/lib/drizzle/schema';
import { DatabaseError } from '@/lib/errors';
import { getAuthenticatedUser } from '@/lib/supabase/get-authenticated-user';
import type { BrowseExerciseItem, GetBrowseExercisesResponse } from '@/features/exercises/browse/api/contracts';
import type { ExerciseTopic } from '@/features/exercises/repository/api/contracts';
import { extractPlainText } from '@/lib/tiptap/extract-text';
import { parseTiptapDocument } from '@/lib/tiptap/parse-document';

export async function listBrowse(): Promise<GetBrowseExercisesResponse> {
  const user = await getAuthenticatedUser();

  try {
    const exerciseRows = await db
      .select({
        id: exercisesInApp.id,
        prompt: exercisesInApp.prompt,
        ownerProfileId: exercisesInApp.ownerProfileId,
      })
      .from(exercisesInApp)
      .where(eq(exercisesInApp.isPublic, true))
      .orderBy(desc(exercisesInApp.createdAt));

    if (exerciseRows.length === 0) {
      return { exercises: [], topics: [] };
    }

    const exerciseIds = exerciseRows.map((row) => row.id);

    const savedRows = await db
      .select({ exerciseId: exerciseLibraryItemsInApp.exerciseId })
      .from(exerciseLibraryItemsInApp)
      .where(eq(exerciseLibraryItemsInApp.profileId, user.id));

    const savedExerciseIds = new Set(savedRows.map((row) => row.exerciseId));

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

    const topicsByExercise = new Map<string, ExerciseTopic[]>();
    const topicMap = new Map<string, ExerciseTopic>();

    for (const row of topicRows) {
      const topic = { id: row.id, name: row.name, slug: row.slug };
      topicMap.set(topic.id, topic);

      const existing = topicsByExercise.get(row.exerciseId) ?? [];
      existing.push(topic);
      topicsByExercise.set(row.exerciseId, existing);
    }

    const exercises: BrowseExerciseItem[] = exerciseRows.map((row) => ({
      id: row.id,
      prompt: extractPlainText(parseTiptapDocument(row.prompt)),
      topics: topicsByExercise.get(row.id) ?? [],
      isSaved: savedExerciseIds.has(row.id),
      isSystem: row.ownerProfileId === null,
    }));

    const topics = [...topicMap.values()].sort((a, b) => a.name.localeCompare(b.name));

    return { exercises, topics };
  } catch (error) {
    throw new DatabaseError('DATABASE_ERROR', { cause: error });
  }
}
