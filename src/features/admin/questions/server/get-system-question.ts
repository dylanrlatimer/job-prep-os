import 'server-only';

import { and, eq, inArray, isNull } from 'drizzle-orm';
import { db } from '@/lib/drizzle/client';
import { theoryQuestionCategoriesInApp, theoryQuestionsInApp } from '@/lib/drizzle/schema';
import { DatabaseError, NotFoundError } from '@/lib/errors';
import { assertAdmin } from '@/features/auth/server/assert-admin';
import type { SystemQuestionResponse } from '@/features/admin/questions/api/contracts';

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
      .where(and(eq(theoryQuestionsInApp.id, id), isNull(theoryQuestionsInApp.ownerProfileId)))
      .limit(1);

    if (!question) {
      throw new NotFoundError('questionNotFound');
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
    if (error instanceof NotFoundError) {
      throw error;
    }
    throw new DatabaseError('DATABASE_ERROR', { cause: error });
  }
}
