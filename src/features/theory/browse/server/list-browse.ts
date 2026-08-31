import 'server-only';

import { desc, eq, inArray } from 'drizzle-orm';
import { db } from '@/lib/drizzle/client';
import { topicsInApp, theoryLibraryItemsInApp, theoryQuestionTopicsInApp, theoryQuestionsInApp } from '@/lib/drizzle/schema';
import { DatabaseError } from '@/lib/errors';
import { getAuthenticatedUser } from '@/lib/supabase/get-authenticated-user';
import { isQuestionAppOwned, questionAccess } from '@/features/theory/server/access';
import type { BrowseQuestionItem, GetBrowseResponse } from '@/features/theory/browse/api/contracts';
import type { RepositoryTopic } from '@/features/theory/repository/api/contracts';

export async function listBrowse(): Promise<GetBrowseResponse> {
  const user = await getAuthenticatedUser();

  try {
    const questionRows = await db
      .select({
        id: theoryQuestionsInApp.id,
        question: theoryQuestionsInApp.question,
        ownerProfileId: theoryQuestionsInApp.ownerProfileId,
        createdAt: theoryQuestionsInApp.createdAt,
      })
      .from(theoryQuestionsInApp)
      .where(questionAccess.public())
      .orderBy(desc(theoryQuestionsInApp.createdAt));

    if (questionRows.length === 0) {
      return { questions: [], topics: [] };
    }

    const questionIds = questionRows.map((row) => row.id);

    const savedRows = await db
      .select({ questionId: theoryLibraryItemsInApp.questionId })
      .from(theoryLibraryItemsInApp)
      .where(questionAccess.inLibrary(user.id));

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
    const topicMap = new Map<string, RepositoryTopic>();

    for (const row of topicRows) {
      const topic = { id: row.id, name: row.name, slug: row.slug, iconKey: row.iconKey };
      topicMap.set(topic.id, topic);

      const existing = topicsByQuestion.get(row.questionId) ?? [];
      existing.push(topic);
      topicsByQuestion.set(row.questionId, existing);
    }

    const questions: BrowseQuestionItem[] = questionRows.map((row) => ({
      id: row.id,
      question: row.question,
      topics: topicsByQuestion.get(row.id) ?? [],
      isSaved: savedQuestionIds.has(row.id),
      isSystem: isQuestionAppOwned(row.ownerProfileId),
      createdAt: row.createdAt,
    }));

    const topics = [...topicMap.values()].sort((a, b) => a.name.localeCompare(b.name));

    return { questions, topics };
  } catch (error) {
    throw new DatabaseError('DATABASE_ERROR', { cause: error });
  }
}
