import 'server-only';

import { desc, eq, inArray } from 'drizzle-orm';
import { db } from '@/lib/drizzle/client';
import { theoryCategoriesInApp, theoryLibraryItemsInApp, theoryQuestionCategoriesInApp, theoryQuestionsInApp } from '@/lib/drizzle/schema';
import { DatabaseError } from '@/lib/errors';
import { getAuthenticatedUser } from '@/lib/supabase/get-authenticated-user';
import type { BrowseQuestionItem, GetBrowseResponse } from '@/features/theory/browse/api/contracts';
import type { RepositoryCategory } from '@/features/theory/repository/api/contracts';

export async function listBrowse(): Promise<GetBrowseResponse> {
  const user = await getAuthenticatedUser();

  try {
    const questionRows = await db
      .select({
        id: theoryQuestionsInApp.id,
        question: theoryQuestionsInApp.question,
        ownerProfileId: theoryQuestionsInApp.ownerProfileId,
      })
      .from(theoryQuestionsInApp)
      .where(eq(theoryQuestionsInApp.isPublic, true))
      .orderBy(desc(theoryQuestionsInApp.createdAt));

    if (questionRows.length === 0) {
      return { questions: [], categories: [] };
    }

    const questionIds = questionRows.map((row) => row.id);

    const savedRows = await db
      .select({ questionId: theoryLibraryItemsInApp.questionId })
      .from(theoryLibraryItemsInApp)
      .where(eq(theoryLibraryItemsInApp.profileId, user.id));

    const savedQuestionIds = new Set(savedRows.map((row) => row.questionId));

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

    const categoriesByQuestion = new Map<string, RepositoryCategory[]>();
    const categoryMap = new Map<string, RepositoryCategory>();

    for (const row of categoryRows) {
      const category = { id: row.id, name: row.name, slug: row.slug };
      categoryMap.set(category.id, category);

      const existing = categoriesByQuestion.get(row.questionId) ?? [];
      existing.push(category);
      categoriesByQuestion.set(row.questionId, existing);
    }

    const questions: BrowseQuestionItem[] = questionRows.map((row) => ({
      id: row.id,
      question: row.question,
      categories: categoriesByQuestion.get(row.id) ?? [],
      isSaved: savedQuestionIds.has(row.id),
      isSystem: row.ownerProfileId === null,
    }));

    const categories = [...categoryMap.values()].sort((a, b) => a.name.localeCompare(b.name));

    return { questions, categories };
  } catch (error) {
    throw new DatabaseError('DATABASE_ERROR', { cause: error });
  }
}
