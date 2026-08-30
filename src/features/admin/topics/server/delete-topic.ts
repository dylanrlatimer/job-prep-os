import 'server-only';

import { count, eq } from 'drizzle-orm';
import { db } from '@/lib/drizzle/client';
import { exerciseTopicsInApp, topicsInApp, theoryQuestionTopicsInApp } from '@/lib/drizzle/schema';
import { DatabaseError, NotFoundError, ValidationError } from '@/lib/errors';
import { assertAdmin } from '@/features/auth/server/assert-admin';
import type { DeleteTopicResponse } from '@/features/admin/topics/api/contracts';

export async function deleteTopic(id: string): Promise<DeleteTopicResponse> {
  await assertAdmin();

  try {
    const [topic] = await db
      .select({ id: topicsInApp.id })
      .from(topicsInApp)
      .where(eq(topicsInApp.id, id))
      .limit(1);

    if (!topic) {
      throw new NotFoundError('topicNotFound');
    }

    const [questionUsage] = await db
      .select({ questionCount: count() })
      .from(theoryQuestionTopicsInApp)
      .where(eq(theoryQuestionTopicsInApp.topicId, id));

    const [exerciseUsage] = await db
      .select({ exerciseCount: count() })
      .from(exerciseTopicsInApp)
      .where(eq(exerciseTopicsInApp.topicId, id));

    if (Number(questionUsage?.questionCount ?? 0) > 0 || Number(exerciseUsage?.exerciseCount ?? 0) > 0) {
      throw new ValidationError('topicInUse');
    }

    await db.delete(topicsInApp).where(eq(topicsInApp.id, id));

    return { id };
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof ValidationError) {
      throw error;
    }
    throw new DatabaseError('DATABASE_ERROR', { cause: error });
  }
}
