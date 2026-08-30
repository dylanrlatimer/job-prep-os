import 'server-only';

import { eq } from 'drizzle-orm';
import { db } from '@/lib/drizzle/client';
import { theoryQuestionTopicsInApp, theoryQuestionsInApp } from '@/lib/drizzle/schema';
import { DatabaseError, ForbiddenError, NotFoundError } from '@/lib/errors';
import { getAuthenticatedUser } from '@/lib/supabase/get-authenticated-user';
import { assertQuestionOwnedBy } from '@/features/theory/server/access';
import type { QuestionResponse } from '@/features/theory/builder/api/contracts';
import { parseTiptapDocument } from '@/lib/tiptap/parse-document';

export async function getQuestion(id: string): Promise<QuestionResponse> {
  const user = await getAuthenticatedUser();

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

    assertQuestionOwnedBy(user.id, question);

    const topicRows = await db
      .select({ topicId: theoryQuestionTopicsInApp.topicId })
      .from(theoryQuestionTopicsInApp)
      .where(eq(theoryQuestionTopicsInApp.questionId, id));

    return {
      id: question.id,
      question: question.question,
      answer: parseTiptapDocument(question.answer),
      topicIds: topicRows.map((row) => row.topicId),
      sourceName: question.sourceName,
      sourceUrl: question.sourceUrl,
      isPublic: question.isPublic,
    };
  } catch (error) {
    if (error instanceof ForbiddenError || error instanceof NotFoundError) {
      throw error;
    }
    throw new DatabaseError('DATABASE_ERROR', { cause: error });
  }
}
