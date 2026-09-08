import 'server-only';

import { and, asc, eq, inArray, sql } from 'drizzle-orm';
import { db } from '@/lib/drizzle/client';
import {
  exerciseLibraryItemsInApp,
  exerciseTopicsInApp,
  profilesInApp,
  theoryLibraryItemsInApp,
  theoryQuestionTopicsInApp,
  topicsInApp,
} from '@/lib/drizzle/schema';
import { DatabaseError, NotFoundError } from '@/lib/errors';
import { getAuthenticatedUser } from '@/lib/supabase/get-authenticated-user';
import { exerciseAccess } from '@/features/exercises/server/access';
import { questionAccess } from '@/features/theory/server/access';
import type { GetSessionSetupResponse, SessionSetupTopic } from '@/features/practice/sessions/api/contracts';

export async function getSessionSetup(): Promise<GetSessionSetupResponse> {
  const user = await getAuthenticatedUser();

  try {
    const [profile] = await db.select({ exerciseRatio: profilesInApp.exerciseRatio }).from(profilesInApp).where(eq(profilesInApp.id, user.id)).limit(1);

    if (!profile) {
      throw new NotFoundError('profileNotFound');
    }

    const [theoryCountRows, exerciseCountRows] = await Promise.all([
      db
        .select({
          topicId: theoryQuestionTopicsInApp.topicId,
          count: sql<number>`count(distinct ${theoryLibraryItemsInApp.questionId})`,
        })
        .from(theoryLibraryItemsInApp)
        .innerJoin(theoryQuestionTopicsInApp, eq(theoryLibraryItemsInApp.questionId, theoryQuestionTopicsInApp.questionId))
        .where(questionAccess.inLibrary(user.id))
        .groupBy(theoryQuestionTopicsInApp.topicId),
      db
        .select({
          topicId: exerciseTopicsInApp.topicId,
          count: sql<number>`count(distinct ${exerciseLibraryItemsInApp.exerciseId})`,
        })
        .from(exerciseLibraryItemsInApp)
        .innerJoin(exerciseTopicsInApp, eq(exerciseLibraryItemsInApp.exerciseId, exerciseTopicsInApp.exerciseId))
        .where(exerciseAccess.inLibrary(user.id))
        .groupBy(exerciseTopicsInApp.topicId),
    ]);

    const theoryCountByTopic = new Map(theoryCountRows.map((row) => [row.topicId, Number(row.count)]));
    const exerciseCountByTopic = new Map(exerciseCountRows.map((row) => [row.topicId, Number(row.count)]));
    const topicIds = [...new Set([...theoryCountByTopic.keys(), ...exerciseCountByTopic.keys()])];

    if (topicIds.length === 0) {
      return { exerciseRatio: profile.exerciseRatio, topics: [] };
    }

    const topicRows = await db
      .select({
        id: topicsInApp.id,
        name: topicsInApp.name,
        slug: topicsInApp.slug,
        iconKey: topicsInApp.iconKey,
      })
      .from(topicsInApp)
      .where(and(eq(topicsInApp.isActive, true), inArray(topicsInApp.id, topicIds)))
      .orderBy(asc(topicsInApp.name));

    const topics: SessionSetupTopic[] = topicRows.map((topic) => ({
      id: topic.id,
      name: topic.name,
      slug: topic.slug,
      iconKey: topic.iconKey,
      theoryCount: theoryCountByTopic.get(topic.id) ?? 0,
      exerciseCount: exerciseCountByTopic.get(topic.id) ?? 0,
    }));

    return { exerciseRatio: profile.exerciseRatio, topics };
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw error;
    }
    throw new DatabaseError('DATABASE_ERROR', { cause: error });
  }
}
