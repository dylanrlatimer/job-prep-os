import 'server-only';

import { desc, eq, inArray, isNull } from 'drizzle-orm';
import { db } from '@/lib/drizzle/client';
import { exerciseTopicsInApp, exercisesInApp, topicsInApp } from '@/lib/drizzle/schema';
import { DatabaseError } from '@/lib/errors';
import { assertAdmin } from '@/features/auth/server/assert-admin';
import type { ListSystemExercisesResponse, SystemExerciseListItem } from '@/features/admin/exercises/api/contracts';
import type { ExerciseTopic } from '@/features/exercises/repository/api/contracts';
import { extractPlainText } from '@/lib/tiptap/extract-text';
import { parseTiptapDocument } from '@/lib/tiptap/parse-document';

export async function listSystemExercises(): Promise<ListSystemExercisesResponse> {
  await assertAdmin();

  try {
    const exerciseRows = await db
      .select({
        id: exercisesInApp.id,
        prompt: exercisesInApp.prompt,
        isPublic: exercisesInApp.isPublic,
        updatedAt: exercisesInApp.updatedAt,
      })
      .from(exercisesInApp)
      .where(isNull(exercisesInApp.ownerProfileId))
      .orderBy(desc(exercisesInApp.updatedAt));

    if (exerciseRows.length === 0) {
      const topics = await db
        .select({
          id: topicsInApp.id,
          name: topicsInApp.name,
          slug: topicsInApp.slug,
        })
        .from(topicsInApp);

      return { exercises: [], topics: topics.sort((a, b) => a.name.localeCompare(b.name)) };
    }

    const exerciseIds = exerciseRows.map((row) => row.id);

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

    const exercises: SystemExerciseListItem[] = exerciseRows.map((row) => ({
      id: row.id,
      prompt: extractPlainText(parseTiptapDocument(row.prompt)),
      isPublic: row.isPublic,
      topics: topicsByExercise.get(row.id) ?? [],
      updatedAt: row.updatedAt,
    }));

    const topics = [...topicMap.values()].sort((a, b) => a.name.localeCompare(b.name));

    return { exercises, topics };
  } catch (error) {
    throw new DatabaseError('DATABASE_ERROR', { cause: error });
  }
}
