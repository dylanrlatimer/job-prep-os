import 'server-only';

import { and, count, desc, eq, exists, inArray } from 'drizzle-orm';
import { getAuthenticatedUser } from '@/lib/supabase/get-authenticated-user';
import { db } from '@/lib/drizzle/client';
import { theoryAttemptsInApp, topicsInApp, theoryLibraryItemsInApp, theoryQuestionTopicsInApp, theoryQuestionsInApp } from '@/lib/drizzle/schema';
import { DatabaseError } from '@/lib/errors';
import { isQuestionOwnedBy, questionAccess } from '@/features/theory/server/access';
import { andFilters, ilikeContains, listOffset, listPageMeta, PAGE_SIZE } from '@/common/lib/pagination';
import type {
  GetRepositoryResponse,
  RepositoryAttemptTotals,
  RepositoryListQuery,
  RepositoryQuestionItem,
  RepositoryTopic,
} from '@/features/theory/repository/api/contracts';

const emptyTotals = (): RepositoryAttemptTotals => ({
  incorrect: 0,
  partial: 0,
  correct: 0,
});

function topicExists(topicId: string) {
  return exists(
    db
      .select({ questionId: theoryQuestionTopicsInApp.questionId })
      .from(theoryQuestionTopicsInApp)
      .where(and(eq(theoryQuestionTopicsInApp.questionId, theoryLibraryItemsInApp.questionId), eq(theoryQuestionTopicsInApp.topicId, topicId))),
  );
}

export async function listRepository(query: RepositoryListQuery): Promise<GetRepositoryResponse> {
  const user = await getAuthenticatedUser();
  const search = query.search.trim();

  try {
    const universe = questionAccess.inLibrary(user.id);
    const filters = andFilters(
      universe,
      search ? ilikeContains(theoryQuestionsInApp.question, search) : undefined,
      query.topicId ? topicExists(query.topicId) : undefined,
    );

    const [unfilteredRow] = await db.select({ value: count() }).from(theoryLibraryItemsInApp).where(universe);
    const unfilteredCount = Number(unfilteredRow?.value ?? 0);

    const [filteredRow] = await db
      .select({ value: count() })
      .from(theoryLibraryItemsInApp)
      .innerJoin(theoryQuestionsInApp, eq(theoryLibraryItemsInApp.questionId, theoryQuestionsInApp.id))
      .where(filters);

    const totalCount = Number(filteredRow?.value ?? 0);

    const catalogRows = await db
      .selectDistinct({
        id: topicsInApp.id,
        name: topicsInApp.name,
        slug: topicsInApp.slug,
        iconKey: topicsInApp.iconKey,
      })
      .from(theoryLibraryItemsInApp)
      .innerJoin(theoryQuestionTopicsInApp, eq(theoryQuestionTopicsInApp.questionId, theoryLibraryItemsInApp.questionId))
      .innerJoin(topicsInApp, eq(topicsInApp.id, theoryQuestionTopicsInApp.topicId))
      .where(universe);

    const topics = catalogRows.sort((left, right) => left.name.localeCompare(right.name));
    const meta = listPageMeta(query.page, totalCount, unfilteredCount);

    if (totalCount === 0) {
      return { questions: [], topics, ...meta };
    }

    const libraryRows = await db
      .select({
        questionId: theoryLibraryItemsInApp.questionId,
        question: theoryQuestionsInApp.question,
        ownerProfileId: theoryQuestionsInApp.ownerProfileId,
      })
      .from(theoryLibraryItemsInApp)
      .innerJoin(theoryQuestionsInApp, eq(theoryLibraryItemsInApp.questionId, theoryQuestionsInApp.id))
      .where(filters)
      .orderBy(desc(theoryLibraryItemsInApp.createdAt))
      .limit(PAGE_SIZE)
      .offset(listOffset(query.page));

    const questionIds = libraryRows.map((row) => row.questionId);

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

    const attemptRows =
      questionIds.length === 0
        ? []
        : await db
            .select({
              questionId: theoryAttemptsInApp.questionId,
              result: theoryAttemptsInApp.result,
            })
            .from(theoryAttemptsInApp)
            .where(and(eq(theoryAttemptsInApp.profileId, user.id), inArray(theoryAttemptsInApp.questionId, questionIds)));

    const topicsByQuestion = new Map<string, RepositoryTopic[]>();
    for (const row of topicRows) {
      const topic = { id: row.id, name: row.name, slug: row.slug, iconKey: row.iconKey };
      const existing = topicsByQuestion.get(row.questionId) ?? [];
      existing.push(topic);
      topicsByQuestion.set(row.questionId, existing);
    }

    const attemptsByQuestion = new Map<string, RepositoryAttemptTotals>();
    for (const row of attemptRows) {
      const totals = attemptsByQuestion.get(row.questionId) ?? emptyTotals();
      totals[row.result] += 1;
      attemptsByQuestion.set(row.questionId, totals);
    }

    const questions: RepositoryQuestionItem[] = libraryRows.map((row) => ({
      id: row.questionId,
      question: row.question,
      topics: topicsByQuestion.get(row.questionId) ?? [],
      attempts: attemptsByQuestion.get(row.questionId) ?? emptyTotals(),
      canUnsave: !isQuestionOwnedBy(user.id, row.ownerProfileId),
    }));

    return { questions, topics, ...meta };
  } catch (error) {
    throw new DatabaseError('DATABASE_ERROR', { cause: error });
  }
}
