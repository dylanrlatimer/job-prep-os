import 'server-only';

import { asc, eq, inArray, sql } from 'drizzle-orm';
import { db } from '@/lib/drizzle/client';
import {
  exerciseAttemptsInApp,
  exerciseTopicsInApp,
  exercisesInApp,
  practiceSessionItemsInApp,
  practiceSessionsInApp,
  theoryAttemptsInApp,
  theoryQuestionTopicsInApp,
  theoryQuestionsInApp,
  topicsInApp,
} from '@/lib/drizzle/schema';
import { AppError, DatabaseError, NotFoundError } from '@/lib/errors';
import { getAuthenticatedUser } from '@/lib/supabase/get-authenticated-user';
import { assertSessionOwnedBy } from '@/features/practice/server/access';
import type {
  AttemptResult,
  ContentFilter,
  SessionHistoryDetailResponse,
  SessionHistoryItemEntry,
  SessionHistoryResult,
  SessionTopic,
} from '@/features/practice/sessions/api/contracts';
import { namesForTopicIds, resolveTopicNames } from './topic-names';

function asContentFilter(value: string): ContentFilter {
  if (value === 'theory' || value === 'exercises') {
    return value;
  }

  return 'all';
}

function emptyResult(): SessionHistoryResult {
  return { incorrect: 0, partial: 0, correct: 0, skipped: 0 };
}

function asAttemptResult(value: string | null): AttemptResult | null {
  if (value === 'incorrect' || value === 'partial' || value === 'correct') {
    return value;
  }

  return null;
}

export async function getSessionHistoryDetail(sessionId: string): Promise<SessionHistoryDetailResponse> {
  const user = await getAuthenticatedUser();

  try {
    const [session] = await db
      .select({
        id: practiceSessionsInApp.id,
        profileId: practiceSessionsInApp.profileId,
        status: practiceSessionsInApp.status,
        topicIds: practiceSessionsInApp.topicIds,
        contentFilter: practiceSessionsInApp.contentFilter,
        completedAt: practiceSessionsInApp.completedAt,
        createdAt: practiceSessionsInApp.createdAt,
      })
      .from(practiceSessionsInApp)
      .where(eq(practiceSessionsInApp.id, sessionId))
      .limit(1);

    assertSessionOwnedBy(user.id, session);

    if (session.status !== 'completed') {
      throw new NotFoundError('sessionNotFound');
    }

    const itemRows = await db
      .select({
        id: practiceSessionItemsInApp.id,
        position: practiceSessionItemsInApp.position,
        contentType: practiceSessionItemsInApp.contentType,
        contentId: practiceSessionItemsInApp.contentId,
        skipped: practiceSessionItemsInApp.skipped,
        result: sql<string | null>`coalesce(${theoryAttemptsInApp.result}, ${exerciseAttemptsInApp.result})`,
      })
      .from(practiceSessionItemsInApp)
      .leftJoin(theoryAttemptsInApp, eq(practiceSessionItemsInApp.theoryAttemptId, theoryAttemptsInApp.id))
      .leftJoin(exerciseAttemptsInApp, eq(practiceSessionItemsInApp.exerciseAttemptId, exerciseAttemptsInApp.id))
      .where(eq(practiceSessionItemsInApp.sessionId, sessionId))
      .orderBy(asc(practiceSessionItemsInApp.position));

    const theoryContentIds = itemRows.filter((row) => row.contentType === 'theory').map((row) => row.contentId);
    const exerciseContentIds = itemRows.filter((row) => row.contentType === 'exercise').map((row) => row.contentId);

    const [theoryLabels, exerciseLabels, theoryTopicRows, exerciseTopicRows] = await Promise.all([
      theoryContentIds.length > 0
        ? db
            .select({ id: theoryQuestionsInApp.id, question: theoryQuestionsInApp.question })
            .from(theoryQuestionsInApp)
            .where(inArray(theoryQuestionsInApp.id, theoryContentIds))
        : Promise.resolve([]),
      exerciseContentIds.length > 0
        ? db.select({ id: exercisesInApp.id, title: exercisesInApp.title }).from(exercisesInApp).where(inArray(exercisesInApp.id, exerciseContentIds))
        : Promise.resolve([]),
      theoryContentIds.length > 0
        ? db
            .select({
              contentId: theoryQuestionTopicsInApp.questionId,
              id: topicsInApp.id,
              name: topicsInApp.name,
              slug: topicsInApp.slug,
              iconKey: topicsInApp.iconKey,
            })
            .from(theoryQuestionTopicsInApp)
            .innerJoin(topicsInApp, eq(theoryQuestionTopicsInApp.topicId, topicsInApp.id))
            .where(inArray(theoryQuestionTopicsInApp.questionId, theoryContentIds))
        : Promise.resolve([]),
      exerciseContentIds.length > 0
        ? db
            .select({
              contentId: exerciseTopicsInApp.exerciseId,
              id: topicsInApp.id,
              name: topicsInApp.name,
              slug: topicsInApp.slug,
              iconKey: topicsInApp.iconKey,
            })
            .from(exerciseTopicsInApp)
            .innerJoin(topicsInApp, eq(exerciseTopicsInApp.topicId, topicsInApp.id))
            .where(inArray(exerciseTopicsInApp.exerciseId, exerciseContentIds))
        : Promise.resolve([]),
    ]);

    const labelByContentId = new Map<string, string>();
    for (const row of theoryLabels) {
      labelByContentId.set(row.id, row.question);
    }
    for (const row of exerciseLabels) {
      labelByContentId.set(row.id, row.title);
    }

    const topicsByContentId = new Map<string, SessionTopic[]>();
    for (const row of [...theoryTopicRows, ...exerciseTopicRows]) {
      const topic = { id: row.id, name: row.name, slug: row.slug, iconKey: row.iconKey };
      const existing = topicsByContentId.get(row.contentId) ?? [];
      existing.push(topic);
      topicsByContentId.set(row.contentId, existing);
    }

    const result = emptyResult();
    const items: SessionHistoryItemEntry[] = itemRows.map((row) => {
      const attemptResult = row.skipped ? null : asAttemptResult(row.result);
      if (row.skipped) {
        result.skipped += 1;
      } else if (attemptResult) {
        result[attemptResult] += 1;
      }

      return {
        id: row.id,
        position: row.position,
        contentType: row.contentType,
        contentId: row.contentId,
        label: labelByContentId.get(row.contentId) ?? '[Deleted]',
        topics: (topicsByContentId.get(row.contentId) ?? []).sort((left, right) => left.name.localeCompare(right.name)),
        status: row.skipped ? 'skipped' : 'answered',
        result: attemptResult,
      };
    });

    const topicNames = await resolveTopicNames(session.topicIds);

    return {
      id: session.id,
      topicIds: session.topicIds,
      topicNames: namesForTopicIds(session.topicIds, topicNames),
      contentFilter: asContentFilter(session.contentFilter),
      result,
      total: items.length,
      completedAt: session.completedAt ?? session.createdAt,
      createdAt: session.createdAt,
      items,
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new DatabaseError('DATABASE_ERROR', { cause: error });
  }
}
