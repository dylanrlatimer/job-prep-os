import 'server-only';

import { db } from '@/lib/drizzle/client';
import { practiceSessionItemsInApp, practiceSessionsInApp, practiceSessionTopicsInApp } from '@/lib/drizzle/schema';
import { DatabaseError, ValidationError } from '@/lib/errors';
import { getAuthenticatedUser } from '@/lib/supabase/get-authenticated-user';
import type { CreateSessionInput, CreateSessionResponse } from '@/features/practice/sessions/api/contracts';
import { buildQueue, fillsToPreview } from './build-queue';
import { loadInventory } from './load-inventory';

export async function createSession(input: CreateSessionInput): Promise<CreateSessionResponse> {
  const user = await getAuthenticatedUser();

  try {
    const inventory = await loadInventory(
      user.id,
      input.topics.map((topic) => topic.topicId),
    );
    const { queue, fills } = buildQueue(input.topics, inventory, input.exerciseRatio);

    if (queue.length === 0) {
      throw new ValidationError('emptyQueue');
    }

    return await db.transaction(async (tx) => {
      const [session] = await tx
        .insert(practiceSessionsInApp)
        .values({
          profileId: user.id,
          status: 'active',
          exerciseRatio: input.exerciseRatio,
        })
        .returning({ id: practiceSessionsInApp.id });

      if (!session) {
        throw new DatabaseError('DATABASE_ERROR');
      }

      await tx.insert(practiceSessionTopicsInApp).values(
        input.topics.map((topic) => ({
          sessionId: session.id,
          topicId: topic.topicId,
          requestedCount: topic.count,
        })),
      );

      await tx.insert(practiceSessionItemsInApp).values(
        queue.map((item, position) => ({
          sessionId: session.id,
          position,
          contentType: item.contentType,
          contentId: item.contentId,
          topicId: item.topicId,
        })),
      );

      return { id: session.id, ...fillsToPreview(fills) };
    });
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }
    throw new DatabaseError('DATABASE_ERROR', { cause: error });
  }
}
