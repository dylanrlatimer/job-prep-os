import 'server-only';

import { and, desc, eq, inArray } from 'drizzle-orm';
import { getAuthenticatedUser } from '@/lib/supabase/get-authenticated-user';
import { db } from '@/lib/drizzle/client';
import { theoryAttemptsInApp, topicsInApp, theoryLibraryItemsInApp, theoryQuestionTopicsInApp, theoryQuestionsInApp } from '@/lib/drizzle/schema';
import { DatabaseError } from '@/lib/errors';
import { isQuestionOwnedBy, questionAccess } from '@/features/theory/server/access';
import type { GetRepositoryResponse, RepositoryAttemptTotals, RepositoryTopic, RepositoryQuestionItem } from '@/features/theory/repository/api/contracts';

const emptyTotals = (): RepositoryAttemptTotals => ({
  incorrect: 0,
  partial: 0,
  correct: 0,
});

export async function listRepository(): Promise<GetRepositoryResponse> {
  const user = await getAuthenticatedUser();

  try {
    const libraryRows = await db
      .select({
        questionId: theoryLibraryItemsInApp.questionId,
        question: theoryQuestionsInApp.question,
        ownerProfileId: theoryQuestionsInApp.ownerProfileId,
      })
      .from(theoryLibraryItemsInApp)
      .innerJoin(theoryQuestionsInApp, eq(theoryLibraryItemsInApp.questionId, theoryQuestionsInApp.id))
      .where(questionAccess.inLibrary(user.id))
      .orderBy(desc(theoryLibraryItemsInApp.createdAt));

    if (libraryRows.length === 0) {
      return { questions: [], topics: [] };
    }

    const questionIds = libraryRows.map((row) => row.questionId);

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

    const attemptRows = await db
      .select({
        questionId: theoryAttemptsInApp.questionId,
        result: theoryAttemptsInApp.result,
      })
      .from(theoryAttemptsInApp)
      .where(and(eq(theoryAttemptsInApp.profileId, user.id), inArray(theoryAttemptsInApp.questionId, questionIds)));

    const topicsByQuestion = new Map<string, RepositoryTopic[]>();
    const topicMap = new Map<string, RepositoryTopic>();

    for (const row of topicRows) {
      const topic = { id: row.id, name: row.name, slug: row.slug, iconKey: row.iconKey };
      topicMap.set(topic.id, topic);

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

    const topics = [...topicMap.values()].sort((a, b) => a.name.localeCompare(b.name));

    return { questions, topics };
  } catch (error) {
    throw new DatabaseError('DATABASE_ERROR', { cause: error });
  }
}
