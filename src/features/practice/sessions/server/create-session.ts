import 'server-only';

import { and, eq, inArray } from 'drizzle-orm';
import { db } from '@/lib/drizzle/client';
import {
  exerciseLibraryItemsInApp,
  exerciseTopicsInApp,
  practiceSessionItemsInApp,
  practiceSessionsInApp,
  theoryLibraryItemsInApp,
  theoryQuestionTopicsInApp,
} from '@/lib/drizzle/schema';
import { DatabaseError, ValidationError } from '@/lib/errors';
import { getAuthenticatedUser } from '@/lib/supabase/get-authenticated-user';
import { exerciseAccess } from '@/features/exercises/server/access';
import { questionAccess } from '@/features/theory/server/access';
import type { CreateSessionInput, CreateSessionResponse } from '@/features/practice/sessions/api/contracts';

type QueueItem = {
  contentType: 'theory' | 'exercise';
  contentId: string;
};

function shuffle<T>(items: T[]): T[] {
  const next = [...items];

  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    const current = next[index]!;
    next[index] = next[swapIndex]!;
    next[swapIndex] = current;
  }

  return next;
}

async function listTheoryContentIds(userId: string, topicIds: string[]): Promise<string[]> {
  if (topicIds.length === 0) {
    const rows = await db
      .selectDistinct({ questionId: theoryLibraryItemsInApp.questionId })
      .from(theoryLibraryItemsInApp)
      .where(questionAccess.inLibrary(userId));

    return rows.map((row) => row.questionId);
  }

  const rows = await db
    .selectDistinct({ questionId: theoryLibraryItemsInApp.questionId })
    .from(theoryLibraryItemsInApp)
    .innerJoin(theoryQuestionTopicsInApp, eq(theoryLibraryItemsInApp.questionId, theoryQuestionTopicsInApp.questionId))
    .where(and(questionAccess.inLibrary(userId), inArray(theoryQuestionTopicsInApp.topicId, topicIds)));

  return rows.map((row) => row.questionId);
}

async function listExerciseContentIds(userId: string, topicIds: string[]): Promise<string[]> {
  if (topicIds.length === 0) {
    const rows = await db
      .selectDistinct({ exerciseId: exerciseLibraryItemsInApp.exerciseId })
      .from(exerciseLibraryItemsInApp)
      .where(exerciseAccess.inLibrary(userId));

    return rows.map((row) => row.exerciseId);
  }

  const rows = await db
    .selectDistinct({ exerciseId: exerciseLibraryItemsInApp.exerciseId })
    .from(exerciseLibraryItemsInApp)
    .innerJoin(exerciseTopicsInApp, eq(exerciseLibraryItemsInApp.exerciseId, exerciseTopicsInApp.exerciseId))
    .where(and(exerciseAccess.inLibrary(userId), inArray(exerciseTopicsInApp.topicId, topicIds)));

  return rows.map((row) => row.exerciseId);
}

export async function createSession(input: CreateSessionInput): Promise<CreateSessionResponse> {
  const user = await getAuthenticatedUser();

  try {
    const theoryIds = input.contentFilter === 'exercises' ? [] : await listTheoryContentIds(user.id, input.topicIds);
    const exerciseIds = input.contentFilter === 'theory' ? [] : await listExerciseContentIds(user.id, input.topicIds);

    const queue: QueueItem[] = shuffle([
      ...theoryIds.map((contentId) => ({ contentType: 'theory' as const, contentId })),
      ...exerciseIds.map((contentId) => ({ contentType: 'exercise' as const, contentId })),
    ]);

    if (queue.length === 0) {
      throw new ValidationError('emptyQueue');
    }

    return await db.transaction(async (tx) => {
      const [session] = await tx
        .insert(practiceSessionsInApp)
        .values({
          profileId: user.id,
          status: 'active',
          topicIds: input.topicIds,
          contentFilter: input.contentFilter,
        })
        .returning({ id: practiceSessionsInApp.id });

      if (!session) {
        throw new DatabaseError('DATABASE_ERROR');
      }

      await tx.insert(practiceSessionItemsInApp).values(
        queue.map((item, position) => ({
          sessionId: session.id,
          position,
          contentType: item.contentType,
          contentId: item.contentId,
        })),
      );

      return { id: session.id };
    });
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }
    throw new DatabaseError('DATABASE_ERROR', { cause: error });
  }
}
