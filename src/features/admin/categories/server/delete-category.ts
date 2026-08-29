import 'server-only';

import { count, eq } from 'drizzle-orm';
import { db } from '@/lib/drizzle/client';
import { theoryCategoriesInApp, theoryQuestionCategoriesInApp } from '@/lib/drizzle/schema';
import { DatabaseError, NotFoundError, ValidationError } from '@/lib/errors';
import { assertAdmin } from '@/features/auth/server/assert-admin';
import type { DeleteCategoryResponse } from '@/features/admin/categories/api/contracts';

export async function deleteCategory(id: string): Promise<DeleteCategoryResponse> {
  await assertAdmin();

  try {
    const [category] = await db
      .select({ id: theoryCategoriesInApp.id })
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

    if (Number(usage?.questionCount ?? 0) > 0) {
      throw new ValidationError('categoryInUse');
    }

    await db.delete(theoryCategoriesInApp).where(eq(theoryCategoriesInApp.id, id));

    return { id };
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof ValidationError) {
      throw error;
    }
    throw new DatabaseError('DATABASE_ERROR', { cause: error });
  }
}
