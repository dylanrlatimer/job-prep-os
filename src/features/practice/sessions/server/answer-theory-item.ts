import 'server-only';

import { and, eq } from 'drizzle-orm';
import { db } from '@/lib/drizzle/client';
import { practiceSessionItemsInApp, theoryAttemptsInApp } from '@/lib/drizzle/schema';
import { DatabaseError, NotFoundError, ValidationError } from '@/lib/errors';
import type { AnswerTheoryItemInput, AnswerTheoryItemResponse } from '@/features/practice/sessions/api/contracts';
import { completeSessionIfDone } from './complete-session-if-done';

export async function answerTheoryItem(sessionId: string, itemId: string, input: AnswerTheoryItemInput, userId: string): Promise<AnswerTheoryItemResponse> {
  const [item] = await db
    .select({
      id: practiceSessionItemsInApp.id,
      contentType: practiceSessionItemsInApp.contentType,
      contentId: practiceSessionItemsInApp.contentId,
      answeredAt: practiceSessionItemsInApp.answeredAt,
      skipped: practiceSessionItemsInApp.skipped,
    })
    .from(practiceSessionItemsInApp)
    .where(and(eq(practiceSessionItemsInApp.id, itemId), eq(practiceSessionItemsInApp.sessionId, sessionId)))
    .limit(1);

  if (!item) {
    throw new NotFoundError('sessionItemNotFound');
  }

  if (item.contentType !== 'theory') {
    throw new ValidationError('wrongContentType');
  }

  if (item.answeredAt || item.skipped) {
    throw new ValidationError('itemAlreadyDone');
  }

  try {
    const attemptId = await db.transaction(async (tx) => {
      const [created] = await tx
        .insert(theoryAttemptsInApp)
        .values({
          profileId: userId,
          questionId: item.contentId,
          result: input.result,
          response: input.response,
          notes: input.notes,
        })
        .returning({ id: theoryAttemptsInApp.id });

      if (!created) {
        throw new DatabaseError('DATABASE_ERROR');
      }

      await tx
        .update(practiceSessionItemsInApp)
        .set({
          theoryAttemptId: created.id,
          answeredAt: new Date().toISOString(),
        })
        .where(eq(practiceSessionItemsInApp.id, itemId));

      return created.id;
    });

    const sessionComplete = await completeSessionIfDone(sessionId);
    return { attemptId, sessionComplete };
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof ValidationError) {
      throw error;
    }
    throw new DatabaseError('DATABASE_ERROR', { cause: error });
  }
}
