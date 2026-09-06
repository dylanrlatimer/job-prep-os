import 'server-only';

import { and, count, desc, eq, exists, inArray, not, sql } from 'drizzle-orm';
import { db } from '@/lib/drizzle/client';
import { topicsInApp, theoryLibraryItemsInApp, theoryQuestionTopicsInApp, theoryQuestionsInApp } from '@/lib/drizzle/schema';
import { DatabaseError } from '@/lib/errors';
import { getOptionalUser } from '@/lib/supabase/get-authenticated-user';
import { isQuestionAppOwned, questionAccess } from '@/features/theory/server/access';
import { andFilters, ilikeContains, listOffset, listPageMeta, PAGE_SIZE } from '@/common/lib/pagination';
import type { BrowseListQuery, BrowseQuestionItem, GetBrowseResponse } from '@/features/theory/browse/api/contracts';
import type { BrowseSavedFilter } from '@/features/theory/browse/lib/browse-filters';
import type { RepositoryTopic } from '@/features/theory/repository/api/contracts';

function topicExists(topicId: string) {
  return exists(
    db
      .select({ questionId: theoryQuestionTopicsInApp.questionId })
      .from(theoryQuestionTopicsInApp)
      .where(and(eq(theoryQuestionTopicsInApp.questionId, theoryQuestionsInApp.id), eq(theoryQuestionTopicsInApp.topicId, topicId))),
  );
}

function savedExists(userId: string) {
  return exists(
    db
      .select({ questionId: theoryLibraryItemsInApp.questionId })
      .from(theoryLibraryItemsInApp)
      .where(and(eq(theoryLibraryItemsInApp.questionId, theoryQuestionsInApp.id), eq(theoryLibraryItemsInApp.profileId, userId))),
  );
}

export function browseQuestionFilters(search: string, topicId: string | undefined, saved: BrowseSavedFilter, userId: string | undefined) {
  const savedFilter =
    saved === 'all' ? undefined : !userId ? (saved === 'saved' ? sql`false` : undefined) : saved === 'saved' ? savedExists(userId) : not(savedExists(userId));

  return andFilters(questionAccess.public(), search ? ilikeContains(theoryQuestionsInApp.question, search) : undefined, topicId ? topicExists(topicId) : undefined, savedFilter);
}

export async function listPublicQuestionTopics() {
  const rows = await db
    .selectDistinct({
      id: topicsInApp.id,
      name: topicsInApp.name,
      slug: topicsInApp.slug,
      iconKey: topicsInApp.iconKey,
    })
    .from(theoryQuestionTopicsInApp)
    .innerJoin(theoryQuestionsInApp, eq(theoryQuestionsInApp.id, theoryQuestionTopicsInApp.questionId))
    .innerJoin(topicsInApp, eq(topicsInApp.id, theoryQuestionTopicsInApp.topicId))
    .where(questionAccess.public());

  return rows.sort((left, right) => left.name.localeCompare(right.name));
}

export async function listBrowseQuestionIds(query: BrowseListQuery, userId: string | undefined) {
  const search = query.search.trim();
  const filters = browseQuestionFilters(search, query.topicId, query.saved, userId);

  return db
    .select({
      id: theoryQuestionsInApp.id,
      createdAt: theoryQuestionsInApp.createdAt,
    })
    .from(theoryQuestionsInApp)
    .where(filters)
    .orderBy(desc(theoryQuestionsInApp.createdAt));
}

export async function hydrateBrowseQuestions(questionIds: string[], userId: string | undefined): Promise<BrowseQuestionItem[]> {
  if (questionIds.length === 0) {
    return [];
  }

  const questionRows = await db
    .select({
      id: theoryQuestionsInApp.id,
      question: theoryQuestionsInApp.question,
      ownerProfileId: theoryQuestionsInApp.ownerProfileId,
      createdAt: theoryQuestionsInApp.createdAt,
    })
    .from(theoryQuestionsInApp)
    .where(inArray(theoryQuestionsInApp.id, questionIds));

  const savedRows = userId
    ? await db
        .select({ questionId: theoryLibraryItemsInApp.questionId })
        .from(theoryLibraryItemsInApp)
        .where(and(eq(theoryLibraryItemsInApp.profileId, userId), inArray(theoryLibraryItemsInApp.questionId, questionIds)))
    : [];

  const savedQuestionIds = new Set(savedRows.map((row) => row.questionId));

  const topicRows = await db
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

  const questionsById = new Map(questionRows.map((row) => [row.id, row]));

  return questionIds.flatMap((id) => {
    const row = questionsById.get(id);
    if (!row) return [];
    return [
      {
        id: row.id,
        question: row.question,
        topics: topicsByQuestion.get(row.id) ?? [],
        isSaved: savedQuestionIds.has(row.id),
        isSystem: isQuestionAppOwned(row.ownerProfileId),
        createdAt: row.createdAt,
      },
    ];
  });
}

export async function listBrowse(query: BrowseListQuery): Promise<GetBrowseResponse> {
  const user = await getOptionalUser();
  const search = query.search.trim();

  try {
    const universe = questionAccess.public();
    const filters = browseQuestionFilters(search, query.topicId, query.saved, user?.id);

    const [unfilteredRow] = await db.select({ value: count() }).from(theoryQuestionsInApp).where(universe);
    const unfilteredCount = Number(unfilteredRow?.value ?? 0);

    const [filteredRow] = await db.select({ value: count() }).from(theoryQuestionsInApp).where(filters);
    const totalCount = Number(filteredRow?.value ?? 0);

    const topics = await listPublicQuestionTopics();
    const meta = listPageMeta(query.page, totalCount, unfilteredCount);

    if (totalCount === 0) {
      return { questions: [], topics, ...meta };
    }

    const pageRows = await db
      .select({ id: theoryQuestionsInApp.id })
      .from(theoryQuestionsInApp)
      .where(filters)
      .orderBy(desc(theoryQuestionsInApp.createdAt))
      .limit(PAGE_SIZE)
      .offset(listOffset(query.page));

    const questions = await hydrateBrowseQuestions(
      pageRows.map((row) => row.id),
      user?.id,
    );

    return { questions, topics, ...meta };
  } catch (error) {
    throw new DatabaseError('DATABASE_ERROR', { cause: error });
  }
}
