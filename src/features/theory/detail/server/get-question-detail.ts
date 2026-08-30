import 'server-only';

import { eq } from 'drizzle-orm';
import { db } from '@/lib/drizzle/client';
import { topicsInApp, theoryQuestionTopicsInApp, theoryQuestionsInApp } from '@/lib/drizzle/schema';
import { DatabaseError, NotFoundError } from '@/lib/errors';
import { getAuthenticatedUser } from '@/lib/supabase/get-authenticated-user';
import type { QuestionDetailResponse } from '@/features/theory/detail/api/contracts';
import type { RepositoryTopic } from '@/features/theory/repository/api/contracts';
import { assertQuestionInLibrary } from '@/features/theory/practice/server/assert-question-in-library';
import { listQuestionAttempts } from '@/features/theory/practice/server/list-question-attempts';
import { parseTiptapDocument } from '@/lib/tiptap/parse-document';

export async function getQuestionDetail(id: string): Promise<QuestionDetailResponse> {
  const user = await getAuthenticatedUser();
  await assertQuestionInLibrary(user.id, id);

  try {
    const [question] = await db
      .select({
        id: theoryQuestionsInApp.id,
        ownerProfileId: theoryQuestionsInApp.ownerProfileId,
        question: theoryQuestionsInApp.question,
        answer: theoryQuestionsInApp.answer,
        sourceName: theoryQuestionsInApp.sourceName,
        sourceUrl: theoryQuestionsInApp.sourceUrl,
        isPublic: theoryQuestionsInApp.isPublic,
      })
      .from(theoryQuestionsInApp)
      .where(eq(theoryQuestionsInApp.id, id))
      .limit(1);

    if (!question) {
      throw new NotFoundError('questionNotFound');
    }

    const topicRows = await db
      .select({
        id: topicsInApp.id,
        name: topicsInApp.name,
        slug: topicsInApp.slug,
      })
      .from(theoryQuestionTopicsInApp)
      .innerJoin(topicsInApp, eq(theoryQuestionTopicsInApp.topicId, topicsInApp.id))
      .where(eq(theoryQuestionTopicsInApp.questionId, id));

    const topics: RepositoryTopic[] = topicRows
      .map((row) => ({ id: row.id, name: row.name, slug: row.slug }))
      .sort((a, b) => a.name.localeCompare(b.name));

    const { attempts, attemptHistory } = await listQuestionAttempts(user.id, id);

    return {
      id: question.id,
      question: question.question,
      answer: parseTiptapDocument(question.answer),
      topics,
      sourceName: question.sourceName,
      sourceUrl: question.sourceUrl,
      isPublic: question.isPublic,
      isOwner: question.ownerProfileId === user.id,
      attempts,
      attemptHistory,
    };
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw error;
    }
    throw new DatabaseError('DATABASE_ERROR', { cause: error });
  }
}
