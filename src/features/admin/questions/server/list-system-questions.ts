import 'server-only';

import { desc, eq, inArray, isNull } from 'drizzle-orm';
import { db } from '@/lib/drizzle/client';
import { theoryCategoriesInApp, theoryQuestionCategoriesInApp, theoryQuestionsInApp } from '@/lib/drizzle/schema';
import { DatabaseError } from '@/lib/errors';
import { assertAdmin } from '@/features/auth/server/assert-admin';
import type { ListSystemQuestionsResponse, SystemQuestionListItem } from '@/features/admin/questions/api/contracts';
import type { RepositoryCategory } from '@/features/theory/repository/api/contracts';

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
      .where(isNull(theoryQuestionsInApp.ownerProfileId))
      .orderBy(desc(theoryQuestionsInApp.updatedAt));

    if (questionRows.length === 0) {
      const categories = await db
        .select({
          id: theoryCategoriesInApp.id,
          name: theoryCategoriesInApp.name,
          slug: theoryCategoriesInApp.slug,
        })
        .from(theoryCategoriesInApp);

      return { questions: [], categories: categories.sort((a, b) => a.name.localeCompare(b.name)) };
    }

    const questionIds = questionRows.map((row) => row.id);

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

    const questions: SystemQuestionListItem[] = questionRows.map((row) => ({
      id: row.id,
      question: row.question,
      isPublic: row.isPublic,
      categories: categoriesByQuestion.get(row.id) ?? [],
      updatedAt: row.updatedAt,
    }));

    const categories = [...categoryMap.values()].sort((a, b) => a.name.localeCompare(b.name));

    return { questions, categories };
  } catch (error) {
    throw new DatabaseError('DATABASE_ERROR', { cause: error });
  }
}
