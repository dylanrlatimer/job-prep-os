import 'server-only';

import { desc, eq, inArray } from 'drizzle-orm';
import { db } from '@/lib/drizzle/client';
import { topicsInApp, theoryQuestionTopicsInApp, theoryQuestionsInApp } from '@/lib/drizzle/schema';
import { DatabaseError } from '@/lib/errors';
import { assertAdmin } from '@/features/auth/server/assert-admin';
import { questionAccess } from '@/features/theory/server/access';
import type { ListSystemQuestionsResponse, SystemQuestionListItem } from '@/features/admin/questions/api/contracts';
import type { RepositoryTopic } from '@/features/theory/repository/api/contracts';

export async function listSystemQuestions(): Promise<ListSystemQuestionsResponse> {
  await assertAdmin();

  try {
    const questionRows = await db
      .select({
        id: theoryQuestionsInApp.id,
        question: theoryQuestionsInApp.question,
        isPublic: theoryQuestionsInApp.isPublic,
        updatedAt: theoryQuestionsInApp.updatedAt,
      })
      .from(theoryQuestionsInApp)
      .where(questionAccess.appOwned())
      .orderBy(desc(theoryQuestionsInApp.updatedAt));

    if (questionRows.length === 0) {
      const topics = await db
        .select({
          id: topicsInApp.id,
          name: topicsInApp.name,
          slug: topicsInApp.slug,
        })
        .from(topicsInApp);

      return { questions: [], topics: topics.sort((a, b) => a.name.localeCompare(b.name)) };
    }

    const questionIds = questionRows.map((row) => row.id);

    const topicRows = await db
      .select({
        questionId: theoryQuestionTopicsInApp.questionId,
        id: topicsInApp.id,
        name: topicsInApp.name,
        slug: topicsInApp.slug,
      })
      .from(theoryQuestionTopicsInApp)
      .innerJoin(topicsInApp, eq(theoryQuestionTopicsInApp.topicId, topicsInApp.id))
      .where(inArray(theoryQuestionTopicsInApp.questionId, questionIds));

    const topicsByQuestion = new Map<string, RepositoryTopic[]>();
    const topicMap = new Map<string, RepositoryTopic>();

    for (const row of topicRows) {
      const topic = { id: row.id, name: row.name, slug: row.slug };
      topicMap.set(topic.id, topic);

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

    const topics = [...topicMap.values()].sort((a, b) => a.name.localeCompare(b.name));

    return { questions, topics };
  } catch (error) {
    throw new DatabaseError('DATABASE_ERROR', { cause: error });
  }
}
