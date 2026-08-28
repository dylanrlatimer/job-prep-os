import 'server-only';

import { and, desc, eq, inArray } from 'drizzle-orm';
import { getAuthenticatedUser } from '@/lib/supabase/get-authenticated-user';
import { db } from '@/lib/drizzle/client';
import { theoryAttemptsInApp, theoryCategoriesInApp, theoryLibraryItemsInApp, theoryQuestionCategoriesInApp, theoryQuestionsInApp } from '@/lib/drizzle/schema';
import { DatabaseError } from '@/lib/errors';
import type { GetRepositoryResponse, RepositoryAttemptTotals, RepositoryCategory, RepositoryQuestionItem } from '@/features/theory/repository/api/contracts';

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
      })
      .from(theoryLibraryItemsInApp)
      .innerJoin(theoryQuestionsInApp, eq(theoryLibraryItemsInApp.questionId, theoryQuestionsInApp.id))
      .where(eq(theoryLibraryItemsInApp.profileId, user.id))
      .orderBy(desc(theoryLibraryItemsInApp.createdAt));

    if (libraryRows.length === 0) {
      return { questions: [], categories: [] };
    }

    const questionIds = libraryRows.map((row) => row.questionId);

    const categoryRows = await db
      .select({
        questionId: theoryQuestionCategoriesInApp.questionId,
        id: theoryCategoriesInApp.id,
        name: theoryCategoriesInApp.name,
        slug: theoryCategoriesInApp.slug,
      })
      .from(theoryQuestionCategoriesInApp)
      .innerJoin(theoryCategoriesInApp, eq(theoryQuestionCategoriesInApp.categoryId, theoryCategoriesInApp.id))
      .where(inArray(theoryQuestionCategoriesInApp.questionId, questionIds));

    const attemptRows = await db
      .select({
        questionId: theoryAttemptsInApp.questionId,
        result: theoryAttemptsInApp.result,
      })
      .from(theoryAttemptsInApp)
      .where(and(eq(theoryAttemptsInApp.profileId, user.id), inArray(theoryAttemptsInApp.questionId, questionIds)));

    const categoriesByQuestion = new Map<string, RepositoryCategory[]>();
    const categoryMap = new Map<string, RepositoryCategory>();

    for (const row of categoryRows) {
      const category = { id: row.id, name: row.name, slug: row.slug };
      categoryMap.set(category.id, category);

      const existing = categoriesByQuestion.get(row.questionId) ?? [];
      existing.push(category);
      categoriesByQuestion.set(row.questionId, existing);
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
      categories: categoriesByQuestion.get(row.questionId) ?? [],
      attempts: attemptsByQuestion.get(row.questionId) ?? emptyTotals(),
    }));

    const categories = [...categoryMap.values()].sort((a, b) => a.name.localeCompare(b.name));

    return { questions, categories };
  } catch (error) {
    throw new DatabaseError('DATABASE_ERROR', { cause: error });
  }
}
