import 'server-only';

import { and, asc, eq } from 'drizzle-orm';
import { db } from '@/lib/drizzle/client';
import { exerciseChoicesInApp, exerciseTopicsInApp, exercisesInApp, topicsInApp } from '@/lib/drizzle/schema';
import { DatabaseError, NotFoundError } from '@/lib/errors';
import { assertAdmin } from '@/features/auth/server/assert-admin';
import { exerciseAccess } from '@/features/exercises/server/access';
import type { SystemExerciseResponse } from '@/features/admin/exercises/api/contracts';
import { parseTiptapDocument } from '@/lib/tiptap/parse-document';

export async function getSystemExercise(id: string): Promise<SystemExerciseResponse> {
  await assertAdmin();

  try {
    const [exercise] = await db
      .select({
        id: exercisesInApp.id,
        title: exercisesInApp.title,
        prompt: exercisesInApp.prompt,
        explanation: exercisesInApp.explanation,
        sourceName: exercisesInApp.sourceName,
        sourceUrl: exercisesInApp.sourceUrl,
        isPublic: exercisesInApp.isPublic,
        allowMultiple: exercisesInApp.allowMultiple,
      })
      .from(exercisesInApp)
      .where(and(eq(exercisesInApp.id, id), exerciseAccess.appOwned()))
      .limit(1);

    if (!exercise) {
      throw new NotFoundError('exerciseNotFound');
    }

    const topicRows = await db
      .select({
        id: topicsInApp.id,
        name: topicsInApp.name,
        slug: topicsInApp.slug,
        iconKey: topicsInApp.iconKey,
      })
      .from(exerciseTopicsInApp)
      .innerJoin(topicsInApp, eq(exerciseTopicsInApp.topicId, topicsInApp.id))
      .where(eq(exerciseTopicsInApp.exerciseId, id));

    const topics = topicRows.map((row) => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      iconKey: row.iconKey,
    }));

    const choiceRows = await db
      .select({
        content: exerciseChoicesInApp.content,
        isCorrect: exerciseChoicesInApp.isCorrect,
        position: exerciseChoicesInApp.position,
      })
      .from(exerciseChoicesInApp)
      .where(eq(exerciseChoicesInApp.exerciseId, id))
      .orderBy(asc(exerciseChoicesInApp.position));

    return {
      id: exercise.id,
      title: exercise.title,
      prompt: parseTiptapDocument(exercise.prompt),
      explanation: exercise.explanation ? parseTiptapDocument(exercise.explanation) : null,
      topicIds: topics.map((topic) => topic.id),
      topics,
      sourceName: exercise.sourceName,
      sourceUrl: exercise.sourceUrl,
      isPublic: exercise.isPublic,
      allowMultiple: exercise.allowMultiple,
      choices: choiceRows.map((row) => ({
        content: parseTiptapDocument(row.content),
        isCorrect: row.isCorrect,
      })),
    };
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw error;
    }
    throw new DatabaseError('DATABASE_ERROR', { cause: error });
  }
}
