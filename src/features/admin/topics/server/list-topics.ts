import 'server-only';

import { asc, count, eq, inArray, or } from 'drizzle-orm';
import { db } from '@/lib/drizzle/client';
import { exerciseTopicsInApp, topicsInApp, theoryQuestionTopicsInApp } from '@/lib/drizzle/schema';
import { DatabaseError } from '@/lib/errors';
import { assertAdmin } from '@/features/auth/server/assert-admin';
import { andFilters, ilikeContains, listOffset, listPageMeta, PAGE_SIZE } from '@/common/lib/pagination';
import type { AdminTopicItem, AdminTopicListQuery, ListAdminTopicsResponse, TopicStatusFilter } from '@/features/admin/topics/api/contracts';

function statusFilter(status: TopicStatusFilter) {
  if (status === 'active') return eq(topicsInApp.isActive, true);
  if (status === 'disabled') return eq(topicsInApp.isActive, false);
  return undefined;
}

export async function listAdminTopics(query: AdminTopicListQuery): Promise<ListAdminTopicsResponse> {
  await assertAdmin();
  const search = query.search.trim();

  try {
    const filters = andFilters(
      search ? or(ilikeContains(topicsInApp.name, search), ilikeContains(topicsInApp.slug, search)) : undefined,
      statusFilter(query.status),
    );

    const [unfilteredRow] = await db.select({ value: count() }).from(topicsInApp);
    const unfilteredCount = Number(unfilteredRow?.value ?? 0);

    const [filteredRow] = await db.select({ value: count() }).from(topicsInApp).where(filters);
    const totalCount = Number(filteredRow?.value ?? 0);
    const meta = listPageMeta(query.page, totalCount, unfilteredCount);

    if (totalCount === 0) {
      return { topics: [], ...meta };
    }

    const topics = await db
      .select({
        id: topicsInApp.id,
        name: topicsInApp.name,
        slug: topicsInApp.slug,
        iconKey: topicsInApp.iconKey,
        isActive: topicsInApp.isActive,
      })
      .from(topicsInApp)
      .where(filters)
      .orderBy(asc(topicsInApp.name))
      .limit(PAGE_SIZE)
      .offset(listOffset(query.page));

    const topicIds = topics.map((topic) => topic.id);

    const questionUsageRows =
      topicIds.length === 0
        ? []
        : await db
            .select({
              topicId: theoryQuestionTopicsInApp.topicId,
              questionCount: count(),
            })
            .from(theoryQuestionTopicsInApp)
            .where(inArray(theoryQuestionTopicsInApp.topicId, topicIds))
            .groupBy(theoryQuestionTopicsInApp.topicId);

    const exerciseUsageRows =
      topicIds.length === 0
        ? []
        : await db
            .select({
              topicId: exerciseTopicsInApp.topicId,
              exerciseCount: count(),
            })
            .from(exerciseTopicsInApp)
            .where(inArray(exerciseTopicsInApp.topicId, topicIds))
            .groupBy(exerciseTopicsInApp.topicId);

    const questionCountByTopic = new Map(questionUsageRows.map((row) => [row.topicId, Number(row.questionCount)]));
    const exerciseCountByTopic = new Map(exerciseUsageRows.map((row) => [row.topicId, Number(row.exerciseCount)]));

    const items: AdminTopicItem[] = topics.map((topic) => ({
      ...topic,
      questionCount: questionCountByTopic.get(topic.id) ?? 0,
      exerciseCount: exerciseCountByTopic.get(topic.id) ?? 0,
    }));

    return { topics: items, ...meta };
  } catch (error) {
    throw new DatabaseError('DATABASE_ERROR', { cause: error });
  }
}
