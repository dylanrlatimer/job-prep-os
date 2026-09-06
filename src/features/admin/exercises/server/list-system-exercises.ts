import 'server-only';

import { and, count, desc, eq, exists, inArray } from 'drizzle-orm';
import { db } from '@/lib/drizzle/client';
import { exerciseTopicsInApp, exercisesInApp, topicsInApp } from '@/lib/drizzle/schema';
import { DatabaseError } from '@/lib/errors';
import { assertAdmin } from '@/features/auth/server/assert-admin';
import { exerciseAccess } from '@/features/exercises/server/access';
import { andFilters, ilikeContains, listOffset, listPageMeta, PAGE_SIZE } from '@/common/lib/pagination';
import type { ListSystemExercisesResponse, SystemExerciseListItem, SystemExerciseListQuery } from '@/features/admin/exercises/api/contracts';
import type { ExerciseTopic } from '@/features/exercises/repository/api/contracts';
import type { PublicationFilter } from '@/common/lib/list-filters';

function topicExists(topicId: string) {
  return exists(
    db
      .select({ exerciseId: exerciseTopicsInApp.exerciseId })
      .from(exerciseTopicsInApp)
      .where(and(eq(exerciseTopicsInApp.exerciseId, exercisesInApp.id), eq(exerciseTopicsInApp.topicId, topicId))),
  );
}

function publicationFilter(publication: PublicationFilter) {
  if (publication === 'published') return eq(exercisesInApp.isPublic, true);
  if (publication === 'draft') return eq(exercisesInApp.isPublic, false);
  return undefined;
}

export async function listSystemExercises(query: SystemExerciseListQuery): Promise<ListSystemExercisesResponse> {
  await assertAdmin();
  const search = query.search.trim();

  try {
    const universe = exerciseAccess.appOwned();
    const filters = andFilters(
      universe,
      search ? ilikeContains(exercisesInApp.title, search) : undefined,
      query.topicId ? topicExists(query.topicId) : undefined,
      publicationFilter(query.publication),
    );

    const [unfilteredRow] = await db.select({ value: count() }).from(exercisesInApp).where(universe);
    const unfilteredCount = Number(unfilteredRow?.value ?? 0);

    const [filteredRow] = await db.select({ value: count() }).from(exercisesInApp).where(filters);
    const totalCount = Number(filteredRow?.value ?? 0);

    const catalogRows = await db
      .selectDistinct({
        id: topicsInApp.id,
        name: topicsInApp.name,
        slug: topicsInApp.slug,
        iconKey: topicsInApp.iconKey,
      })
      .from(exerciseTopicsInApp)
      .innerJoin(exercisesInApp, eq(exercisesInApp.id, exerciseTopicsInApp.exerciseId))
      .innerJoin(topicsInApp, eq(topicsInApp.id, exerciseTopicsInApp.topicId))
      .where(universe);

    const topics = catalogRows.sort((left, right) => left.name.localeCompare(right.name));
    const meta = listPageMeta(query.page, totalCount, unfilteredCount);

    if (totalCount === 0) {
      return { exercises: [], topics, ...meta };
    }

    const exerciseRows = await db
      .select({
        id: exercisesInApp.id,
        title: exercisesInApp.title,
        isPublic: exercisesInApp.isPublic,
        updatedAt: exercisesInApp.updatedAt,
      })
      .from(exercisesInApp)
      .where(filters)
      .orderBy(desc(exercisesInApp.updatedAt))
      .limit(PAGE_SIZE)
      .offset(listOffset(query.page));

    const exerciseIds = exerciseRows.map((row) => row.id);
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

    const topicsByExercise = new Map<string, ExerciseTopic[]>();
    for (const row of topicRows) {
      const topic = { id: row.id, name: row.name, slug: row.slug, iconKey: row.iconKey };
      const existing = topicsByExercise.get(row.exerciseId) ?? [];
      existing.push(topic);
      topicsByExercise.set(row.exerciseId, existing);
    }

    const exercises: SystemExerciseListItem[] = exerciseRows.map((row) => ({
      id: row.id,
      title: row.title,
      isPublic: row.isPublic,
      topics: topicsByExercise.get(row.id) ?? [],
      updatedAt: row.updatedAt,
    }));

    return { exercises, topics, ...meta };
  } catch (error) {
    throw new DatabaseError('DATABASE_ERROR', { cause: error });
  }
}
