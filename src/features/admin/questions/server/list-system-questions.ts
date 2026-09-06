import 'server-only';

import { and, count, desc, eq, exists, inArray } from 'drizzle-orm';
import { db } from '@/lib/drizzle/client';
import { topicsInApp, theoryQuestionTopicsInApp, theoryQuestionsInApp } from '@/lib/drizzle/schema';
import { DatabaseError } from '@/lib/errors';
import { assertAdmin } from '@/features/auth/server/assert-admin';
import { questionAccess } from '@/features/theory/server/access';
import { andFilters, ilikeContains, listOffset, listPageMeta, PAGE_SIZE } from '@/common/lib/pagination';
import type { ListSystemQuestionsResponse, SystemQuestionListItem, SystemQuestionListQuery } from '@/features/admin/questions/api/contracts';
import type { RepositoryTopic } from '@/features/theory/repository/api/contracts';
import type { PublicationFilter } from '@/common/lib/list-filters';

function topicExists(topicId: string) {
  return exists(
    db
      .select({ questionId: theoryQuestionTopicsInApp.questionId })
      .from(theoryQuestionTopicsInApp)
      .where(and(eq(theoryQuestionTopicsInApp.questionId, theoryQuestionsInApp.id), eq(theoryQuestionTopicsInApp.topicId, topicId))),
  );
}

function publicationFilter(publication: PublicationFilter) {
  if (publication === 'published') return eq(theoryQuestionsInApp.isPublic, true);
  if (publication === 'draft') return eq(theoryQuestionsInApp.isPublic, false);
  return undefined;
}

export async function listSystemQuestions(query: SystemQuestionListQuery): Promise<ListSystemQuestionsResponse> {
  await assertAdmin();
  const search = query.search.trim();

  try {
    const universe = questionAccess.appOwned();
    const filters = andFilters(
      universe,
      search ? ilikeContains(theoryQuestionsInApp.question, search) : undefined,
      query.topicId ? topicExists(query.topicId) : undefined,
      publicationFilter(query.publication),
    );

    const [unfilteredRow] = await db.select({ value: count() }).from(theoryQuestionsInApp).where(universe);
    const unfilteredCount = Number(unfilteredRow?.value ?? 0);

    const [filteredRow] = await db.select({ value: count() }).from(theoryQuestionsInApp).where(filters);
    const totalCount = Number(filteredRow?.value ?? 0);

    const catalogRows = await db
      .selectDistinct({
        id: topicsInApp.id,
        name: topicsInApp.name,
        slug: topicsInApp.slug,
        iconKey: topicsInApp.iconKey,
      })
      .from(theoryQuestionTopicsInApp)
      .innerJoin(theoryQuestionsInApp, eq(theoryQuestionsInApp.id, theoryQuestionTopicsInApp.questionId))
      .innerJoin(topicsInApp, eq(topicsInApp.id, theoryQuestionTopicsInApp.topicId))
      .where(universe);

    const topics = catalogRows.sort((left, right) => left.name.localeCompare(right.name));
    const meta = listPageMeta(query.page, totalCount, unfilteredCount);

    if (totalCount === 0) {
      return { questions: [], topics, ...meta };
    }

    const questionRows = await db
      .select({
        id: theoryQuestionsInApp.id,
        question: theoryQuestionsInApp.question,
        isPublic: theoryQuestionsInApp.isPublic,
        updatedAt: theoryQuestionsInApp.updatedAt,
      })
      .from(theoryQuestionsInApp)
      .where(filters)
      .orderBy(desc(theoryQuestionsInApp.updatedAt))
      .limit(PAGE_SIZE)
      .offset(listOffset(query.page));

    const questionIds = questionRows.map((row) => row.id);
    const topicRows =
      questionIds.length === 0
        ? []
        : await db
            .select({
              questionId: theoryQuestionTopicsInApp.questionId,
              id: topicsInApp.id,
              name: topicsInApp.name,
              slug: topicsInApp.slug,
              iconKey: topicsInApp.iconKey,
            })
            .from(theoryQuestionTopicsInApp)
            .innerJoin(topicsInApp, eq(theoryQuestionTopicsInApp.topicId, topicsInApp.id))
            .where(inArray(theoryQuestionTopicsInApp.questionId, questionIds));

    const topicsByQuestion = new Map<string, RepositoryTopic[]>();
    for (const row of topicRows) {
      const topic = { id: row.id, name: row.name, slug: row.slug, iconKey: row.iconKey };
      const existing = topicsByQuestion.get(row.questionId) ?? [];
      existing.push(topic);
      topicsByQuestion.set(row.questionId, existing);
    }

    const questions: SystemQuestionListItem[] = questionRows.map((row) => ({
      id: row.id,
      question: row.question,
      isPublic: row.isPublic,
      topics: topicsByQuestion.get(row.id) ?? [],
      updatedAt: row.updatedAt,
    }));

    return { questions, topics, ...meta };
  } catch (error) {
    throw new DatabaseError('DATABASE_ERROR', { cause: error });
  }
}
