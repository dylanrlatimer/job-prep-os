import 'server-only';

import { asc, eq } from 'drizzle-orm';
import { db } from '@/lib/drizzle/client';
import { exerciseChoicesInApp, exerciseTopicsInApp, exercisesInApp } from '@/lib/drizzle/schema';
import { DatabaseError, ForbiddenError, NotFoundError } from '@/lib/errors';
import { getAuthenticatedUser } from '@/lib/supabase/get-authenticated-user';
import type { ExerciseResponse } from '@/features/exercises/builder/api/contracts';
import { parseTiptapDocument } from '@/lib/tiptap/parse-document';

export async function getExercise(id: string): Promise<ExerciseResponse> {
  const user = await getAuthenticatedUser();

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
        isPublic: exercisesInApp.isPublic,
        allowMultiple: exercisesInApp.allowMultiple,
      })
      .from(exercisesInApp)
      .where(eq(exercisesInApp.id, id))
      .limit(1);

    if (!exercise) {
      throw new NotFoundError('exerciseNotFound');
    }

    if (exercise.ownerProfileId !== user.id) {
      throw new ForbiddenError('exerciseForbidden');
    }

    const topicRows = await db.select({ topicId: exerciseTopicsInApp.topicId }).from(exerciseTopicsInApp).where(eq(exerciseTopicsInApp.exerciseId, id));

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
      topicIds: topicRows.map((row) => row.topicId),
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
    if (error instanceof ForbiddenError || error instanceof NotFoundError) {
      throw error;
    }
    throw new DatabaseError('DATABASE_ERROR', { cause: error });
  }
}
