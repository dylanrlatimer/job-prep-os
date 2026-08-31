import 'server-only';

import { eq, sql } from 'drizzle-orm';
import { db } from '@/lib/drizzle/client';
import { practiceSessionItemsInApp, practiceSessionsInApp } from '@/lib/drizzle/schema';

export async function completeSessionIfDone(sessionId: string): Promise<boolean> {
  const [row] = await db
    .select({
      total: sql<number>`count(*)`,
      done: sql<number>`sum(case when ${practiceSessionItemsInApp.answeredAt} is not null or ${practiceSessionItemsInApp.skipped} then 1 else 0 end)`,
    })
    .from(practiceSessionItemsInApp)
    .where(eq(practiceSessionItemsInApp.sessionId, sessionId));

  const total = Number(row?.total ?? 0);
  const done = Number(row?.done ?? 0);
  const sessionComplete = total > 0 && done === total;

  if (sessionComplete) {
    await db
      .update(practiceSessionsInApp)
      .set({
        status: 'completed',
        completedAt: new Date().toISOString(),
      })
      .where(eq(practiceSessionsInApp.id, sessionId));
  }

  return sessionComplete;
}
