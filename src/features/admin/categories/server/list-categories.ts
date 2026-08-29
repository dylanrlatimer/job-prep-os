import 'server-only';

import { asc, count, eq } from 'drizzle-orm';
import { db } from '@/lib/drizzle/client';
import { topicsInApp, theoryQuestionTopicsInApp } from '@/lib/drizzle/schema';
import { DatabaseError } from '@/lib/errors';
import { assertAdmin } from '@/features/auth/server/assert-admin';
import type { AdminCategoryItem, ListAdminCategoriesResponse } from '@/features/admin/categories/api/contracts';

export async function listAdminCategories(): Promise<ListAdminCategoriesResponse> {
  await assertAdmin();

  try {
    const categories = await db
      .select({
        id: topicsInApp.id,
        name: topicsInApp.name,
        slug: topicsInApp.slug,
        isActive: topicsInApp.isActive,
      })
      .from(topicsInApp)
      .orderBy(asc(topicsInApp.name));

    const usageRows = await db
      .select({
        topicId: theoryQuestionTopicsInApp.topicId,
        questionCount: count(),
      })
      .from(theoryQuestionTopicsInApp)
      .groupBy(theoryQuestionTopicsInApp.topicId);

    const questionCountByCategory = new Map(usageRows.map((row) => [row.topicId, Number(row.questionCount)]));

    const items: AdminCategoryItem[] = categories.map((category) => ({
      ...category,
      questionCount: questionCountByCategory.get(category.id) ?? 0,
    }));

    return { categories: items };
  } catch (error) {
    throw new DatabaseError('DATABASE_ERROR', { cause: error });
  }
}
