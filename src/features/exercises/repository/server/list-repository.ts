import 'server-only';

import { and, count, desc, eq, exists, inArray } from 'drizzle-orm';
import { getAuthenticatedUser } from '@/lib/supabase/get-authenticated-user';
import { db } from '@/lib/drizzle/client';
import { exerciseAttemptsInApp, exerciseLibraryItemsInApp, exerciseTopicsInApp, exercisesInApp, topicsInApp } from '@/lib/drizzle/schema';
import { DatabaseError } from '@/lib/errors';
import { exerciseAccess, isExerciseOwnedBy } from '@/features/exercises/server/access';
import { andFilters, ilikeContains, listOffset, listPageMeta, PAGE_SIZE } from '@/common/lib/pagination';
import type {
  ExerciseAttemptTotals,
  ExerciseRepositoryListQuery,
  ExerciseTopic,
  GetExerciseRepositoryResponse,
  RepositoryExerciseItem,
} from '@/features/exercises/repository/api/contracts';

const emptyTotals = (): ExerciseAttemptTotals => ({
  incorrect: 0,
  partial: 0,
  correct: 0,
});

function topicExists(topicId: string) {
  return exists(
    db
      .select({ exerciseId: exerciseTopicsInApp.exerciseId })
      .from(exerciseTopicsInApp)
      .where(and(eq(exerciseTopicsInApp.exerciseId, exerciseLibraryItemsInApp.exerciseId), eq(exerciseTopicsInApp.topicId, topicId))),
  );
}

export async function listRepository(query: ExerciseRepositoryListQuery): Promise<GetExerciseRepositoryResponse> {
  const user = await getAuthenticatedUser();
  const search = query.search.trim();

  try {
    const universe = exerciseAccess.inLibrary(user.id);
    const filters = andFilters(
      universe,
      search ? ilikeContains(exercisesInApp.title, search) : undefined,
      query.topicId ? topicExists(query.topicId) : undefined,
    );

    const [unfilteredRow] = await db.select({ value: count() }).from(exerciseLibraryItemsInApp).where(universe);
    const unfilteredCount = Number(unfilteredRow?.value ?? 0);

    const [filteredRow] = await db
      .select({ value: count() })
      .from(exerciseLibraryItemsInApp)
      .innerJoin(exercisesInApp, eq(exerciseLibraryItemsInApp.exerciseId, exercisesInApp.id))
      .where(filters);

    const totalCount = Number(filteredRow?.value ?? 0);

    const catalogRows = await db
      .selectDistinct({
        id: topicsInApp.id,
        name: topicsInApp.name,
        slug: topicsInApp.slug,
        iconKey: topicsInApp.iconKey,
      })
      .from(exerciseLibraryItemsInApp)
      .innerJoin(exerciseTopicsInApp, eq(exerciseTopicsInApp.exerciseId, exerciseLibraryItemsInApp.exerciseId))
      .innerJoin(topicsInApp, eq(topicsInApp.id, exerciseTopicsInApp.topicId))
      .where(universe);

    const topics = catalogRows.sort((left, right) => left.name.localeCompare(right.name));
    const meta = listPageMeta(query.page, totalCount, unfilteredCount);

    if (totalCount === 0) {
      return { exercises: [], topics, ...meta };
    }

    const libraryRows = await db
      .select({
        exerciseId: exerciseLibraryItemsInApp.exerciseId,
        title: exercisesInApp.title,
        ownerProfileId: exercisesInApp.ownerProfileId,
      })
      .from(exerciseLibraryItemsInApp)
      .innerJoin(exercisesInApp, eq(exerciseLibraryItemsInApp.exerciseId, exercisesInApp.id))
      .where(filters)
      .orderBy(desc(exerciseLibraryItemsInApp.createdAt))
      .limit(PAGE_SIZE)
      .offset(listOffset(query.page));

    const exerciseIds = libraryRows.map((row) => row.exerciseId);

    const topicRows =
      exerciseIds.length === 0
        ? []
        : await db
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

    const attemptRows =
      exerciseIds.length === 0
        ? []
        : await db
            .select({
              exerciseId: exerciseAttemptsInApp.exerciseId,
              result: exerciseAttemptsInApp.result,
            })
            .from(exerciseAttemptsInApp)
            .where(and(eq(exerciseAttemptsInApp.profileId, user.id), inArray(exerciseAttemptsInApp.exerciseId, exerciseIds)));

    const topicsByExercise = new Map<string, ExerciseTopic[]>();
    for (const row of topicRows) {
      const topic = { id: row.id, name: row.name, slug: row.slug, iconKey: row.iconKey };
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

    return { exercises, topics, ...meta };
  } catch (error) {
    throw new DatabaseError('DATABASE_ERROR', { cause: error });
  }
}
