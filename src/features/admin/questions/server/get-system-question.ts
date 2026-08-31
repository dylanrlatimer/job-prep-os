import 'server-only';

import { and, eq } from 'drizzle-orm';
import { db } from '@/lib/drizzle/client';
import { topicsInApp, theoryQuestionTopicsInApp, theoryQuestionsInApp } from '@/lib/drizzle/schema';
import { DatabaseError, NotFoundError } from '@/lib/errors';
import { assertAdmin } from '@/features/auth/server/assert-admin';
import { questionAccess } from '@/features/theory/server/access';
import type { SystemQuestionResponse } from '@/features/admin/questions/api/contracts';
import { parseTiptapDocument } from '@/lib/tiptap/parse-document';

export async function getSystemQuestion(id: string): Promise<SystemQuestionResponse> {
  await assertAdmin();

  try {
    const [question] = await db
      .select({
        id: theoryQuestionsInApp.id,
        question: theoryQuestionsInApp.question,
        answer: theoryQuestionsInApp.answer,
        sourceName: theoryQuestionsInApp.sourceName,
        sourceUrl: theoryQuestionsInApp.sourceUrl,
        isPublic: theoryQuestionsInApp.isPublic,
      })
      .from(theoryQuestionsInApp)
      .where(and(eq(theoryQuestionsInApp.id, id), questionAccess.appOwned()))
      .limit(1);

    if (!question) {
      throw new NotFoundError('questionNotFound');
    }

    const topicRows = await db
      .select({
        id: topicsInApp.id,
        name: topicsInApp.name,
        slug: topicsInApp.slug,
        iconKey: topicsInApp.iconKey,
      })
      .from(theoryQuestionTopicsInApp)
      .innerJoin(topicsInApp, eq(theoryQuestionTopicsInApp.topicId, topicsInApp.id))
      .where(eq(theoryQuestionTopicsInApp.questionId, id));

    const topics = topicRows.map((row) => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      iconKey: row.iconKey,
    }));

    return {
      id: question.id,
      question: question.question,
      answer: parseTiptapDocument(question.answer),
      topicIds: topics.map((topic) => topic.id),
      topics,
      sourceName: question.sourceName,
      sourceUrl: question.sourceUrl,
      isPublic: question.isPublic,
    };
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw error;
    }
    throw new DatabaseError('DATABASE_ERROR', { cause: error });
  }
}
