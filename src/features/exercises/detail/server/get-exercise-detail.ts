import 'server-only';

import { asc, eq } from 'drizzle-orm';
import { db } from '@/lib/drizzle/client';
import { exerciseChoicesInApp, exerciseTopicsInApp, exercisesInApp, topicsInApp } from '@/lib/drizzle/schema';
import { DatabaseError, NotFoundError } from '@/lib/errors';
import { getAuthenticatedUser } from '@/lib/supabase/get-authenticated-user';
import type { ExerciseDetailResponse } from '@/features/exercises/detail/api/contracts';
import { assertExerciseInLibrary, isExerciseOwnedBy } from '@/features/exercises/server/access';
import { listExerciseAttempts } from '@/features/exercises/practice/server/list-exercise-attempts';
import { parseTiptapDocument } from '@/lib/tiptap/parse-document';

export async function getExerciseDetail(id: string): Promise<ExerciseDetailResponse> {
  const user = await getAuthenticatedUser();
  await assertExerciseInLibrary(user.id, id);

  try {
    const [exercise] = await db
      .select({
        id: exercisesInApp.id,
        ownerProfileId: exercisesInApp.ownerProfileId,
        title: exercisesInApp.title,
        prompt: exercisesInApp.prompt,
        explanation: exercisesInApp.explanation,
        sourceName: exercisesInApp.sourceName,
        sourceUrl: exercisesInApp.sourceUrl,
      })
      .from(exercisesInApp)
      .where(eq(exercisesInApp.id, id))
      .limit(1);

    if (!exercise) {
      throw new NotFoundError('exerciseNotFound');
    }

    const topicRows = await db
      .select({
        id: topicsInApp.id,
        name: topicsInApp.name,
        slug: topicsInApp.slug,
      })
      .from(exerciseTopicsInApp)
      .innerJoin(topicsInApp, eq(exerciseTopicsInApp.topicId, topicsInApp.id))
      .where(eq(exerciseTopicsInApp.exerciseId, id));

    const topics = topicRows.map((row) => ({ id: row.id, name: row.name, slug: row.slug })).sort((a, b) => a.name.localeCompare(b.name));

    const choiceRows = await db
      .select({
        id: exerciseChoicesInApp.id,
        content: exerciseChoicesInApp.content,
        isCorrect: exerciseChoicesInApp.isCorrect,
        position: exerciseChoicesInApp.position,
      })
      .from(exerciseChoicesInApp)
      .where(eq(exerciseChoicesInApp.exerciseId, id))
      .orderBy(asc(exerciseChoicesInApp.position));

    const choices = choiceRows.map((row) => ({
      id: row.id,
      content: parseTiptapDocument(row.content),
      isCorrect: row.isCorrect,
      position: row.position,
    }));

    const { attempts, attemptHistory } = await listExerciseAttempts(user.id, id);

    return {
      id: exercise.id,
      title: exercise.title,
      prompt: parseTiptapDocument(exercise.prompt),
      explanation: exercise.explanation ? parseTiptapDocument(exercise.explanation) : null,
      choices,
      topics,
      sourceName: exercise.sourceName,
      sourceUrl: exercise.sourceUrl,
      isOwner: isExerciseOwnedBy(user.id, exercise.ownerProfileId),
      attempts,
      attemptHistory,
    };
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw error;
    }
    throw new DatabaseError('DATABASE_ERROR', { cause: error });
  }
}
