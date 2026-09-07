import 'server-only';

import { and, desc, eq, inArray, sql } from 'drizzle-orm';
import { db } from '@/lib/drizzle/client';
import { practiceSessionItemsInApp, practiceSessionsInApp } from '@/lib/drizzle/schema';
import { DatabaseError } from '@/lib/errors';
import { getAuthenticatedUser } from '@/lib/supabase/get-authenticated-user';
import type { ActiveSessionItem, ListActiveSessionsResponse, SessionProgress } from '@/features/practice/sessions/api/contracts';
import { loadSessionTopics } from './load-session-topics';

export async function listActiveSessions(): Promise<ListActiveSessionsResponse> {
  const user = await getAuthenticatedUser();

  try {
    const sessionRows = await db
      .select({
        id: practiceSessionsInApp.id,
        exerciseRatio: practiceSessionsInApp.exerciseRatio,
        createdAt: practiceSessionsInApp.createdAt,
      })
      .from(practiceSessionsInApp)
      .where(and(eq(practiceSessionsInApp.profileId, user.id), eq(practiceSessionsInApp.status, 'active')))
      .orderBy(desc(practiceSessionsInApp.createdAt));

    if (sessionRows.length === 0) {
      return { sessions: [] };
    }

    const sessionIds = sessionRows.map((row) => row.id);
    const [progressRows, topicsBySession] = await Promise.all([
      db
        .select({
          sessionId: practiceSessionItemsInApp.sessionId,
          total: sql<number>`count(*)`,
          answered: sql<number>`count(${practiceSessionItemsInApp.answeredAt})`,
          skipped: sql<number>`sum(case when ${practiceSessionItemsInApp.skipped} then 1 else 0 end)`,
        })
        .from(practiceSessionItemsInApp)
        .where(inArray(practiceSessionItemsInApp.sessionId, sessionIds))
        .groupBy(practiceSessionItemsInApp.sessionId),
      loadSessionTopics(sessionIds),
    ]);

    const progressBySession = new Map<string, SessionProgress>();
    for (const row of progressRows) {
      progressBySession.set(row.sessionId, {
        total: Number(row.total ?? 0),
        answered: Number(row.answered ?? 0),
        skipped: Number(row.skipped ?? 0),
      });
    }

    const sessions: ActiveSessionItem[] = sessionRows.map((row) => ({
      id: row.id,
      exerciseRatio: row.exerciseRatio,
      topics: topicsBySession.get(row.id) ?? [],
      progress: progressBySession.get(row.id) ?? { answered: 0, skipped: 0, total: 0 },
      createdAt: row.createdAt,
    }));

    return { sessions };
  } catch (error) {
    throw new DatabaseError('DATABASE_ERROR', { cause: error });
  }
}
