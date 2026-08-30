import 'server-only';

import { and, count, eq } from 'drizzle-orm';
import { db } from '@/lib/drizzle/client';
import { exerciseChoicesInApp, exerciseLibraryItemsInApp, exerciseTopicsInApp, exercisesInApp, topicsInApp } from '@/lib/drizzle/schema';
import { DatabaseError, NotFoundError } from '@/lib/errors';
import { getAuthenticatedUser } from '@/lib/supabase/get-authenticated-user';
import { exerciseAccess, isExerciseAppOwned } from '@/features/exercises/server/access';
import type { BrowseExerciseDetailResponse } from '@/features/exercises/browse/api/contracts';
import type { ExerciseTopic } from '@/features/exercises/repository/api/contracts';
import { parseTiptapDocument } from '@/lib/tiptap/parse-document';

export async function getBrowseExerciseDetail(exerciseId: string): Promise<BrowseExerciseDetailResponse> {
  const user = await getAuthenticatedUser();

  try {
    const [exercise] = await db
      .select({
        id: exercisesInApp.id,
        ownerProfileId: exercisesInApp.ownerProfileId,
        title: exercisesInApp.title,
        prompt: exercisesInApp.prompt,
        sourceName: exercisesInApp.sourceName,
        sourceUrl: exercisesInApp.sourceUrl,
      })
      .from(exercisesInApp)
      .where(and(eq(exercisesInApp.id, exerciseId), exerciseAccess.public()))
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
      .where(eq(exerciseTopicsInApp.exerciseId, exerciseId));

    const topics: ExerciseTopic[] = topicRows.map((row) => ({ id: row.id, name: row.name, slug: row.slug })).sort((a, b) => a.name.localeCompare(b.name));

    const [savedRow] = await db
      .select({ exerciseId: exerciseLibraryItemsInApp.exerciseId })
      .from(exerciseLibraryItemsInApp)
      .where(and(eq(exerciseLibraryItemsInApp.profileId, user.id), eq(exerciseLibraryItemsInApp.exerciseId, exerciseId)))
      .limit(1);

    const [choiceCountRow] = await db.select({ count: count() }).from(exerciseChoicesInApp).where(eq(exerciseChoicesInApp.exerciseId, exerciseId));

    return {
      id: exercise.id,
      title: exercise.title,
      prompt: parseTiptapDocument(exercise.prompt),
      topics,
      sourceName: exercise.sourceName,
      sourceUrl: exercise.sourceUrl,
      isSaved: !!savedRow,
      isSystem: isExerciseAppOwned(exercise.ownerProfileId),
      choiceCount: choiceCountRow?.count ?? 0,
    };
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw error;
    }
    throw new DatabaseError('DATABASE_ERROR', { cause: error });
  }
}
