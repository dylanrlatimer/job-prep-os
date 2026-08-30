import 'server-only';

import { count, eq } from 'drizzle-orm';
import { db } from '@/lib/drizzle/client';
import { exerciseTopicsInApp, topicsInApp, theoryQuestionTopicsInApp } from '@/lib/drizzle/schema';
import { DatabaseError, NotFoundError } from '@/lib/errors';
import { assertAdmin } from '@/features/auth/server/assert-admin';
import type { TopicResponse } from '@/features/admin/topics/api/contracts';

export async function getTopic(id: string): Promise<TopicResponse> {
  await assertAdmin();

  try {
    const [topic] = await db
      .select({
        id: topicsInApp.id,
        name: topicsInApp.name,
        slug: topicsInApp.slug,
        isActive: topicsInApp.isActive,
      })
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

    return {
      ...topic,
      questionCount: Number(questionUsage?.questionCount ?? 0),
      exerciseCount: Number(exerciseUsage?.exerciseCount ?? 0),
    };
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw error;
    }
    throw new DatabaseError('DATABASE_ERROR', { cause: error });
  }
}
