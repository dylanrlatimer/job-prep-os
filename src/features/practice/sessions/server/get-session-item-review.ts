import 'server-only';

import { and, eq } from 'drizzle-orm';
import { db } from '@/lib/drizzle/client';
import { practiceSessionItemsInApp, practiceSessionsInApp, theoryQuestionsInApp } from '@/lib/drizzle/schema';
import { AppError, DatabaseError, NotFoundError, ValidationError } from '@/lib/errors';
import { getAuthenticatedUser } from '@/lib/supabase/get-authenticated-user';
import { parseTiptapDocument } from '@/lib/tiptap/parse-document';
import { listQuestionAttempts } from '@/features/theory/practice/server/list-question-attempts';
import { assertSessionOwnedBy } from '@/features/practice/server/access';
import type { SessionItemReviewResponse } from '@/features/practice/sessions/api/contracts';

export async function getSessionItemReview(sessionId: string, itemId: string): Promise<SessionItemReviewResponse> {
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

    const [question] = await db
      .select({ answer: theoryQuestionsInApp.answer })
      .from(theoryQuestionsInApp)
      .where(eq(theoryQuestionsInApp.id, item.contentId))
      .limit(1);

    if (!question) {
      throw new NotFoundError('questionNotFound');
    }

    const { attempts, attemptHistory } = await listQuestionAttempts(user.id, item.contentId);

    return {
      answer: parseTiptapDocument(question.answer),
      attempts,
      attemptHistory,
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new DatabaseError('DATABASE_ERROR', { cause: error });
  }
}
