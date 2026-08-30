import 'server-only';

import { asc, count, eq } from 'drizzle-orm';
import { db } from '@/lib/drizzle/client';
import { exerciseTopicsInApp, topicsInApp, theoryQuestionTopicsInApp } from '@/lib/drizzle/schema';
import { DatabaseError } from '@/lib/errors';
import { assertAdmin } from '@/features/auth/server/assert-admin';
import type { AdminTopicItem, ListAdminTopicsResponse } from '@/features/admin/topics/api/contracts';

export async function listAdminTopics(): Promise<ListAdminTopicsResponse> {
  await assertAdmin();

  try {
    const topics = await db
      .select({
        id: topicsInApp.id,
        name: topicsInApp.name,
        slug: topicsInApp.slug,
        iconKey: topicsInApp.iconKey,
        isActive: topicsInApp.isActive,
      })
      .from(topicsInApp)
      .orderBy(asc(topicsInApp.name));

    const questionUsageRows = await db
      .select({
        topicId: theoryQuestionTopicsInApp.topicId,
        questionCount: count(),
      })
      .from(theoryQuestionTopicsInApp)
      .groupBy(theoryQuestionTopicsInApp.topicId);

    const exerciseUsageRows = await db
      .select({
        topicId: exerciseTopicsInApp.topicId,
        exerciseCount: count(),
      })
      .from(exerciseTopicsInApp)
      .groupBy(exerciseTopicsInApp.topicId);

    const questionCountByTopic = new Map(questionUsageRows.map((row) => [row.topicId, Number(row.questionCount)]));
    const exerciseCountByTopic = new Map(exerciseUsageRows.map((row) => [row.topicId, Number(row.exerciseCount)]));

    const items: AdminTopicItem[] = topics.map((topic) => ({
      ...topic,
      questionCount: questionCountByTopic.get(topic.id) ?? 0,
      exerciseCount: exerciseCountByTopic.get(topic.id) ?? 0,
    }));

    return { topics: items };
  } catch (error) {
    throw new DatabaseError('DATABASE_ERROR', { cause: error });
  }
}
