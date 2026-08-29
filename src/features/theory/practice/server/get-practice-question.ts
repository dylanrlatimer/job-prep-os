import 'server-only';

import { eq } from 'drizzle-orm';
import { db } from '@/lib/drizzle/client';
import { topicsInApp, theoryQuestionTopicsInApp, theoryQuestionsInApp } from '@/lib/drizzle/schema';
import { DatabaseError, NotFoundError } from '@/lib/errors';
import { getAuthenticatedUser } from '@/lib/supabase/get-authenticated-user';
import type { PracticeQuestionResponse } from '@/features/theory/practice/api/contracts';
import type { RepositoryCategory } from '@/features/theory/repository/api/contracts';
import { assertQuestionInLibrary } from '@/features/theory/practice/server/assert-question-in-library';

export async function getPracticeQuestion(id: string): Promise<PracticeQuestionResponse> {
  const user = await getAuthenticatedUser();
  await assertQuestionInLibrary(user.id, id);

  try {
    const [question] = await db
      .select({
        id: theoryQuestionsInApp.id,
        question: theoryQuestionsInApp.question,
        sourceName: theoryQuestionsInApp.sourceName,
        sourceUrl: theoryQuestionsInApp.sourceUrl,
      })
      .from(theoryQuestionsInApp)
      .where(eq(theoryQuestionsInApp.id, id))
      .limit(1);

    if (!question) {
      throw new NotFoundError('questionNotFound');
    }

    const categoryRows = await db
      .select({
        id: topicsInApp.id,
        name: topicsInApp.name,
        slug: topicsInApp.slug,
      })
      .from(theoryQuestionTopicsInApp)
      .innerJoin(topicsInApp, eq(theoryQuestionTopicsInApp.topicId, topicsInApp.id))
      .where(eq(theoryQuestionTopicsInApp.questionId, id));

    const categories: RepositoryCategory[] = categoryRows
      .map((row) => ({ id: row.id, name: row.name, slug: row.slug }))
      .sort((a, b) => a.name.localeCompare(b.name));

    return {
      id: question.id,
      question: question.question,
      categories,
      sourceName: question.sourceName,
      sourceUrl: question.sourceUrl,
    };
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw error;
    }
    throw new DatabaseError('DATABASE_ERROR', { cause: error });
  }
}
