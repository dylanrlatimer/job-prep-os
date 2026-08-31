import 'server-only';

import { and, eq } from 'drizzle-orm';
import { db } from '@/lib/drizzle/client';
import { practiceSessionItemsInApp, practiceSessionsInApp } from '@/lib/drizzle/schema';
import { AppError, DatabaseError, NotFoundError, ValidationError } from '@/lib/errors';
import { getAuthenticatedUser } from '@/lib/supabase/get-authenticated-user';
import { assertSessionOwnedBy } from '@/features/practice/server/access';
import type { SkipItemResponse } from '@/features/practice/sessions/api/contracts';
import { completeSessionIfDone } from './complete-session-if-done';

export async function skipSessionItem(sessionId: string, itemId: string): Promise<SkipItemResponse> {
  const user = await getAuthenticatedUser();

  try {
    const [session] = await db
      .select({
        id: practiceSessionsInApp.id,
        profileId: practiceSessionsInApp.profileId,
      })
      .from(practiceSessionsInApp)
      .where(eq(practiceSessionsInApp.id, sessionId))
      .limit(1);

    assertSessionOwnedBy(user.id, session);

    const [item] = await db
      .select({
        id: practiceSessionItemsInApp.id,
        answeredAt: practiceSessionItemsInApp.answeredAt,
        skipped: practiceSessionItemsInApp.skipped,
      })
      .from(practiceSessionItemsInApp)
      .where(and(eq(practiceSessionItemsInApp.id, itemId), eq(practiceSessionItemsInApp.sessionId, sessionId)))
      .limit(1);

    if (!item) {
      throw new NotFoundError('sessionItemNotFound');
    }

    if (item.answeredAt || item.skipped) {
      throw new ValidationError('itemAlreadyDone');
    }

    await db.update(practiceSessionItemsInApp).set({ skipped: true }).where(eq(practiceSessionItemsInApp.id, itemId));

    return { sessionComplete: await completeSessionIfDone(sessionId) };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new DatabaseError('DATABASE_ERROR', { cause: error });
  }
}
