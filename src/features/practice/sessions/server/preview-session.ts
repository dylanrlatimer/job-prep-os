import 'server-only';

import { DatabaseError } from '@/lib/errors';
import { getAuthenticatedUser } from '@/lib/supabase/get-authenticated-user';
import type { CreateSessionInput, PreviewSessionResponse } from '@/features/practice/sessions/api/contracts';
import { buildQueue, fillsToPreview } from './build-queue';
import { loadInventory } from './load-inventory';

export async function previewSession(input: CreateSessionInput): Promise<PreviewSessionResponse> {
  const user = await getAuthenticatedUser();

  try {
    const inventory = await loadInventory(
      user.id,
      input.topics.map((topic) => topic.topicId),
    );
    const { fills } = buildQueue(input.topics, inventory, input.exerciseRatio);
    return fillsToPreview(fills);
  } catch (error) {
    throw new DatabaseError('DATABASE_ERROR', { cause: error });
  }
}
