import 'server-only';

import { and, asc, eq, inArray, isNotNull, sql } from 'drizzle-orm';
import { db } from '@/lib/drizzle/client';
import { practiceSessionItemsInApp, practiceSessionTopicsInApp, topicsInApp } from '@/lib/drizzle/schema';
import type { SessionAllocation } from '@/features/practice/sessions/api/contracts';

export async function loadSessionTopics(sessionIds: string[]): Promise<Map<string, SessionAllocation[]>> {
  const topicsBySession = new Map<string, SessionAllocation[]>();

  if (sessionIds.length === 0) {
    return topicsBySession;
  }

  const [topicRows, fillRows] = await Promise.all([
    db
      .select({
        sessionId: practiceSessionTopicsInApp.sessionId,
        id: topicsInApp.id,
        name: topicsInApp.name,
        requested: practiceSessionTopicsInApp.requestedCount,
      })
      .from(practiceSessionTopicsInApp)
      .innerJoin(topicsInApp, eq(practiceSessionTopicsInApp.topicId, topicsInApp.id))
      .where(inArray(practiceSessionTopicsInApp.sessionId, sessionIds))
      .orderBy(asc(topicsInApp.name)),
    db
      .select({
        sessionId: practiceSessionItemsInApp.sessionId,
        topicId: practiceSessionItemsInApp.topicId,
        filled: sql<number>`count(*)`,
      })
      .from(practiceSessionItemsInApp)
      .where(and(inArray(practiceSessionItemsInApp.sessionId, sessionIds), isNotNull(practiceSessionItemsInApp.topicId)))
      .groupBy(practiceSessionItemsInApp.sessionId, practiceSessionItemsInApp.topicId),
  ]);

  const filledByKey = new Map<string, number>();
  for (const row of fillRows) {
    if (!row.topicId) {
      continue;
    }

    filledByKey.set(`${row.sessionId}:${row.topicId}`, Number(row.filled));
  }

  for (const row of topicRows) {
    const existing = topicsBySession.get(row.sessionId) ?? [];
    existing.push({
      id: row.id,
      name: row.name,
      requested: row.requested,
      filled: filledByKey.get(`${row.sessionId}:${row.id}`) ?? 0,
    });
    topicsBySession.set(row.sessionId, existing);
  }

  return topicsBySession;
}
