import 'server-only';

import { asc, eq } from 'drizzle-orm';
import { db } from '@/lib/drizzle/client';
import {
  exerciseChoicesInApp,
  exerciseTopicsInApp,
  exercisesInApp,
  topicsInApp,
} from '@/lib/drizzle/schema';
import { DatabaseError, NotFoundError } from '@/lib/errors';
import { getAuthenticatedUser } from '@/lib/supabase/get-authenticated-user';
import type { ExercisePracticeResponse } from '@/features/exercises/practice/api/contracts';
import type { ExerciseTopic } from '@/features/exercises/repository/api/contracts';
import { assertExerciseInLibrary } from '@/features/exercises/practice/server/assert-exercise-in-library';
import { listExerciseAttempts } from '@/features/exercises/practice/server/list-exercise-attempts';
import { parseTiptapDocument } from '@/lib/tiptap/parse-document';

export async function getPracticeExercise(id: string): Promise<ExercisePracticeResponse> {
  const user = await getAuthenticatedUser();
  await assertExerciseInLibrary(user.id, id);

  try {
    const [exercise] = await db
      .select({
        id: exercisesInApp.id,
        prompt: exercisesInApp.prompt,
        allowMultiple: exercisesInApp.allowMultiple,
        sourceName: exercisesInApp.sourceName,
        sourceUrl: exercisesInApp.sourceUrl,
      })
      .from(exercisesInApp)
      .where(eq(exercisesInApp.id, id))
      .limit(1);

    if (!exercise) {
      throw new NotFoundError('exerciseNotFound');
    }

    const [choiceRows, topicRows, { attempts, attemptHistory }] = await Promise.all([
      db
        .select({
          id: exerciseChoicesInApp.id,
          content: exerciseChoicesInApp.content,
          position: exerciseChoicesInApp.position,
        })
        .from(exerciseChoicesInApp)
        .where(eq(exerciseChoicesInApp.exerciseId, id))
        .orderBy(asc(exerciseChoicesInApp.position)),
      db
        .select({
          id: topicsInApp.id,
          name: topicsInApp.name,
          slug: topicsInApp.slug,
        })
        .from(exerciseTopicsInApp)
        .innerJoin(topicsInApp, eq(exerciseTopicsInApp.topicId, topicsInApp.id))
        .where(eq(exerciseTopicsInApp.exerciseId, id)),
      listExerciseAttempts(user.id, id),
    ]);

    const topics: ExerciseTopic[] = topicRows
      .map((row) => ({ id: row.id, name: row.name, slug: row.slug }))
      .sort((a, b) => a.name.localeCompare(b.name));

    return {
      id: exercise.id,
      prompt: parseTiptapDocument(exercise.prompt),
      allowMultiple: exercise.allowMultiple,
      choices: choiceRows.map((choice) => ({
        id: choice.id,
        content: parseTiptapDocument(choice.content),
        position: choice.position,
      })),
      topics,
      sourceName: exercise.sourceName,
      sourceUrl: exercise.sourceUrl,
      attempts,
      attemptHistory: attemptHistory.map(({ id, result, createdAt }) => ({ id, result, createdAt })),
    };
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw error;
    }
    throw new DatabaseError('DATABASE_ERROR', { cause: error });
  }
}
