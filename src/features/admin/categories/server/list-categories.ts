import 'server-only';

import { asc, count, eq } from 'drizzle-orm';
import { db } from '@/lib/drizzle/client';
import { theoryCategoriesInApp, theoryQuestionCategoriesInApp } from '@/lib/drizzle/schema';
import { DatabaseError } from '@/lib/errors';
import { assertAdmin } from '@/features/auth/server/assert-admin';
import type { AdminCategoryItem, ListAdminCategoriesResponse } from '@/features/admin/categories/api/contracts';

export async function listAdminCategories(): Promise<ListAdminCategoriesResponse> {
  await assertAdmin();

  try {
    const categories = await db
      .select({
        id: theoryCategoriesInApp.id,
        name: theoryCategoriesInApp.name,
        slug: theoryCategoriesInApp.slug,
        isActive: theoryCategoriesInApp.isActive,
      })
      .from(theoryCategoriesInApp)
      .orderBy(asc(theoryCategoriesInApp.name));

    const usageRows = await db
      .select({
        categoryId: theoryQuestionCategoriesInApp.categoryId,
        questionCount: count(),
      })
      .from(theoryQuestionCategoriesInApp)
      .groupBy(theoryQuestionCategoriesInApp.categoryId);

    const questionCountByCategory = new Map(usageRows.map((row) => [row.categoryId, Number(row.questionCount)]));

    const items: AdminCategoryItem[] = categories.map((category) => ({
      ...category,
      questionCount: questionCountByCategory.get(category.id) ?? 0,
    }));

    return { categories: items };
  } catch (error) {
    throw new DatabaseError('DATABASE_ERROR', { cause: error });
  }
}
