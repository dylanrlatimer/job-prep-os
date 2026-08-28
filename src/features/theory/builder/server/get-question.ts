import 'server-only';

import { eq } from 'drizzle-orm';
import { db } from '@/lib/drizzle/client';
import { theoryQuestionCategoriesInApp, theoryQuestionsInApp } from '@/lib/drizzle/schema';
import { DatabaseError, ForbiddenError, NotFoundError } from '@/lib/errors';
import { getAuthenticatedUser } from '@/lib/supabase/get-authenticated-user';
import type { QuestionResponse } from '@/features/theory/builder/api/contracts';

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

    if (!question) {
      throw new NotFoundError('questionNotFound');
    }

    if (question.ownerProfileId !== user.id) {
      throw new ForbiddenError('questionForbidden');
    }

    const categoryRows = await db
      .select({ categoryId: theoryQuestionCategoriesInApp.categoryId })
      .from(theoryQuestionCategoriesInApp)
      .where(eq(theoryQuestionCategoriesInApp.questionId, id));

    return {
      id: question.id,
      question: question.question,
      answer: question.answer,
      categoryIds: categoryRows.map((row) => row.categoryId),
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
