import 'server-only';

import { and, count, desc, eq, exists, inArray, not, sql } from 'drizzle-orm';
import { db } from '@/lib/drizzle/client';
import { exerciseLibraryItemsInApp, exerciseTopicsInApp, exercisesInApp, topicsInApp } from '@/lib/drizzle/schema';
import { DatabaseError } from '@/lib/errors';
import { getOptionalUser } from '@/lib/supabase/get-authenticated-user';
import { exerciseAccess, isExerciseAppOwned } from '@/features/exercises/server/access';
import { andFilters, ilikeContains, listOffset, listPageMeta, PAGE_SIZE } from '@/common/lib/pagination';
import type { BrowseExerciseItem, BrowseExerciseListQuery, GetBrowseExercisesResponse } from '@/features/exercises/browse/api/contracts';
import type { BrowseSavedFilter } from '@/features/theory/browse/lib/browse-filters';
import type { ExerciseTopic } from '@/features/exercises/repository/api/contracts';

function topicExists(topicId: string) {
  return exists(
    db
      .select({ exerciseId: exerciseTopicsInApp.exerciseId })
      .from(exerciseTopicsInApp)
      .where(and(eq(exerciseTopicsInApp.exerciseId, exercisesInApp.id), eq(exerciseTopicsInApp.topicId, topicId))),
  );
}

function savedExists(userId: string) {
  return exists(
    db
      .select({ exerciseId: exerciseLibraryItemsInApp.exerciseId })
      .from(exerciseLibraryItemsInApp)
      .where(and(eq(exerciseLibraryItemsInApp.exerciseId, exercisesInApp.id), eq(exerciseLibraryItemsInApp.profileId, userId))),
  );
}

export function browseExerciseFilters(search: string, topicId: string | undefined, saved: BrowseSavedFilter, userId: string | undefined) {
  const savedFilter =
    saved === 'all' ? undefined : !userId ? (saved === 'saved' ? sql`false` : undefined) : saved === 'saved' ? savedExists(userId) : not(savedExists(userId));

  return andFilters(exerciseAccess.public(), search ? ilikeContains(exercisesInApp.title, search) : undefined, topicId ? topicExists(topicId) : undefined, savedFilter);
}

export async function listPublicExerciseTopics() {
  const rows = await db
    .selectDistinct({
      id: topicsInApp.id,
      name: topicsInApp.name,
      slug: topicsInApp.slug,
      iconKey: topicsInApp.iconKey,
    })
    .from(exerciseTopicsInApp)
    .innerJoin(exercisesInApp, eq(exercisesInApp.id, exerciseTopicsInApp.exerciseId))
    .innerJoin(topicsInApp, eq(topicsInApp.id, exerciseTopicsInApp.topicId))
    .where(exerciseAccess.public());

  return rows.sort((left, right) => left.name.localeCompare(right.name));
}

export async function listBrowseExerciseIds(query: BrowseExerciseListQuery, userId: string | undefined) {
  const search = query.search.trim();
  const filters = browseExerciseFilters(search, query.topicId, query.saved, userId);

  return db
    .select({
      id: exercisesInApp.id,
      createdAt: exercisesInApp.createdAt,
    })
    .from(exercisesInApp)
    .where(filters)
    .orderBy(desc(exercisesInApp.createdAt));
}

export async function hydrateBrowseExercises(exerciseIds: string[], userId: string | undefined): Promise<BrowseExerciseItem[]> {
  if (exerciseIds.length === 0) {
    return [];
  }

  const exerciseRows = await db
    .select({
      id: exercisesInApp.id,
      title: exercisesInApp.title,
      ownerProfileId: exercisesInApp.ownerProfileId,
      createdAt: exercisesInApp.createdAt,
    })
    .from(exercisesInApp)
    .where(inArray(exercisesInApp.id, exerciseIds));

  const savedRows = userId
    ? await db
        .select({ exerciseId: exerciseLibraryItemsInApp.exerciseId })
        .from(exerciseLibraryItemsInApp)
        .where(and(eq(exerciseLibraryItemsInApp.profileId, userId), inArray(exerciseLibraryItemsInApp.exerciseId, exerciseIds)))
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
  for (const row of topicRows) {
    const topic = { id: row.id, name: row.name, slug: row.slug, iconKey: row.iconKey };
    const existing = topicsByExercise.get(row.exerciseId) ?? [];
    existing.push(topic);
    topicsByExercise.set(row.exerciseId, existing);
  }

  const exercisesById = new Map(exerciseRows.map((row) => [row.id, row]));

  return exerciseIds.flatMap((id) => {
    const row = exercisesById.get(id);
    if (!row) return [];
    return [
      {
        id: row.id,
        title: row.title,
        topics: topicsByExercise.get(row.id) ?? [],
        isSaved: savedExerciseIds.has(row.id),
        isSystem: isExerciseAppOwned(row.ownerProfileId),
        createdAt: row.createdAt,
      },
    ];
  });
}

export async function listBrowse(query: BrowseExerciseListQuery): Promise<GetBrowseExercisesResponse> {
  const user = await getOptionalUser();
  const search = query.search.trim();

  try {
    const universe = exerciseAccess.public();
    const filters = browseExerciseFilters(search, query.topicId, query.saved, user?.id);

    const [unfilteredRow] = await db.select({ value: count() }).from(exercisesInApp).where(universe);
    const unfilteredCount = Number(unfilteredRow?.value ?? 0);

    const [filteredRow] = await db.select({ value: count() }).from(exercisesInApp).where(filters);
    const totalCount = Number(filteredRow?.value ?? 0);

    const topics = await listPublicExerciseTopics();
    const meta = listPageMeta(query.page, totalCount, unfilteredCount);

    if (totalCount === 0) {
      return { exercises: [], topics, ...meta };
    }

    const pageRows = await db
      .select({ id: exercisesInApp.id })
      .from(exercisesInApp)
      .where(filters)
      .orderBy(desc(exercisesInApp.createdAt))
      .limit(PAGE_SIZE)
      .offset(listOffset(query.page));

    const exercises = await hydrateBrowseExercises(
      pageRows.map((row) => row.id),
      user?.id,
    );

    return { exercises, topics, ...meta };
  } catch (error) {
    throw new DatabaseError('DATABASE_ERROR', { cause: error });
  }
}
