import 'server-only';

import { and, desc, eq, inArray, sql } from 'drizzle-orm';
import { db } from '@/lib/drizzle/client';
import { exerciseAttemptsInApp, practiceSessionItemsInApp, practiceSessionsInApp, theoryAttemptsInApp } from '@/lib/drizzle/schema';
import { DatabaseError } from '@/lib/errors';
import { getAuthenticatedUser } from '@/lib/supabase/get-authenticated-user';
import type { CompletedSessionItem, ListCompletedSessionsResponse, SessionHistoryResult } from '@/features/practice/sessions/api/contracts';
import { loadSessionTopics } from './load-session-topics';

function emptyResult(): SessionHistoryResult {
  return { incorrect: 0, partial: 0, correct: 0, skipped: 0 };
}

export async function listCompletedSessions(): Promise<ListCompletedSessionsResponse> {
  const user = await getAuthenticatedUser();

  try {
    const sessionRows = await db
      .select({
        id: practiceSessionsInApp.id,
        exerciseRatio: practiceSessionsInApp.exerciseRatio,
        completedAt: practiceSessionsInApp.completedAt,
        createdAt: practiceSessionsInApp.createdAt,
      })
      .from(practiceSessionsInApp)
      .where(and(eq(practiceSessionsInApp.profileId, user.id), eq(practiceSessionsInApp.status, 'completed')))
      .orderBy(desc(practiceSessionsInApp.completedAt));

    if (sessionRows.length === 0) {
      return { sessions: [] };
    }

    const sessionIds = sessionRows.map((row) => row.id);
    const [itemResultRows, topicsBySession] = await Promise.all([
      db
        .select({
          sessionId: practiceSessionItemsInApp.sessionId,
          skipped: practiceSessionItemsInApp.skipped,
          result: sql<string | null>`coalesce(${theoryAttemptsInApp.result}, ${exerciseAttemptsInApp.result})`,
        })
        .from(practiceSessionItemsInApp)
        .leftJoin(theoryAttemptsInApp, eq(practiceSessionItemsInApp.theoryAttemptId, theoryAttemptsInApp.id))
        .leftJoin(exerciseAttemptsInApp, eq(practiceSessionItemsInApp.exerciseAttemptId, exerciseAttemptsInApp.id))
        .where(inArray(practiceSessionItemsInApp.sessionId, sessionIds)),
      loadSessionTopics(sessionIds),
    ]);

    const resultBySession = new Map<string, SessionHistoryResult>();
    const totalBySession = new Map<string, number>();

    for (const row of itemResultRows) {
      const totals = resultBySession.get(row.sessionId) ?? emptyResult();
      totalBySession.set(row.sessionId, (totalBySession.get(row.sessionId) ?? 0) + 1);

      if (row.skipped) {
        totals.skipped += 1;
      } else if (row.result === 'incorrect' || row.result === 'partial' || row.result === 'correct') {
        totals[row.result] += 1;
      }

      resultBySession.set(row.sessionId, totals);
    }

    const sessions: CompletedSessionItem[] = sessionRows.map((row) => ({
      id: row.id,
      exerciseRatio: row.exerciseRatio,
      topics: topicsBySession.get(row.id) ?? [],
      result: resultBySession.get(row.id) ?? emptyResult(),
      total: totalBySession.get(row.id) ?? 0,
      completedAt: row.completedAt ?? row.createdAt,
      createdAt: row.createdAt,
    }));

    return { sessions };
  } catch (error) {
    throw new DatabaseError('DATABASE_ERROR', { cause: error });
  }
}
