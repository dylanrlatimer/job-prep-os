import 'server-only';

import { count, eq } from 'drizzle-orm';
import { db } from '@/lib/drizzle/client';
import { theoryCategoriesInApp, theoryQuestionCategoriesInApp } from '@/lib/drizzle/schema';
import { DatabaseError, NotFoundError } from '@/lib/errors';
import { assertAdmin } from '@/features/auth/server/assert-admin';
import type { CategoryResponse } from '@/features/admin/categories/api/contracts';

export async function getCategory(id: string): Promise<CategoryResponse> {
  await assertAdmin();

  try {
    const [category] = await db
      .select({
        id: theoryCategoriesInApp.id,
        name: theoryCategoriesInApp.name,
        slug: theoryCategoriesInApp.slug,
        isActive: theoryCategoriesInApp.isActive,
      })
      .from(theoryCategoriesInApp)
      .where(eq(theoryCategoriesInApp.id, id))
      .limit(1);

    if (!category) {
      throw new NotFoundError('categoryNotFound');
    }

    const [usage] = await db
      .select({ questionCount: count() })
      .from(theoryQuestionCategoriesInApp)
      .where(eq(theoryQuestionCategoriesInApp.categoryId, id));

    return {
      ...category,
      questionCount: Number(usage?.questionCount ?? 0),
    };
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw error;
    }
    throw new DatabaseError('DATABASE_ERROR', { cause: error });
  }
}
