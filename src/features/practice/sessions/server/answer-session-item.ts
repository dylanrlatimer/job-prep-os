import 'server-only';

import { and, eq } from 'drizzle-orm';
import { db } from '@/lib/drizzle/client';
import { practiceSessionItemsInApp, practiceSessionsInApp } from '@/lib/drizzle/schema';
import { z } from 'zod';
import { AppError, DatabaseError, NotFoundError } from '@/lib/errors';
import { getAuthenticatedUser } from '@/lib/supabase/get-authenticated-user';
import { assertSessionOwnedBy } from '@/features/practice/server/access';
import { AnswerExerciseItemSchema, AnswerTheoryItemSchema } from '@/features/practice/sessions/api/contracts';
import type { AnswerExerciseItemResponse, AnswerTheoryItemResponse } from '@/features/practice/sessions/api/contracts';
import { answerExerciseItem } from './answer-exercise-item';
import { answerTheoryItem } from './answer-theory-item';

export async function answerSessionItem(sessionId: string, itemId: string, body: unknown): Promise<AnswerTheoryItemResponse | AnswerExerciseItemResponse> {
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
        contentType: practiceSessionItemsInApp.contentType,
      })
      .from(practiceSessionItemsInApp)
      .where(and(eq(practiceSessionItemsInApp.id, itemId), eq(practiceSessionItemsInApp.sessionId, sessionId)))
      .limit(1);

    if (!item) {
      throw new NotFoundError('sessionItemNotFound');
    }

    if (item.contentType === 'theory') {
      const input = AnswerTheoryItemSchema.parse(body);
      return answerTheoryItem(sessionId, itemId, input, user.id);
    }

    const input = AnswerExerciseItemSchema.parse(body);
    return answerExerciseItem(sessionId, itemId, input, user.id);
  } catch (error) {
    if (error instanceof AppError || error instanceof z.ZodError) {
      throw error;
    }
    throw new DatabaseError('DATABASE_ERROR', { cause: error });
  }
}
