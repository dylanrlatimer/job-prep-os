import 'server-only';

import { eq } from 'drizzle-orm';
import { db } from '@/lib/drizzle/client';
import { theoryCategoriesInApp } from '@/lib/drizzle/schema';
import { DatabaseError, NotFoundError } from '@/lib/errors';
import { assertAdmin } from '@/features/auth/server/assert-admin';
import type { UpdateCategoryInput, UpdateCategoryResponse } from '@/features/admin/categories/api/contracts';

export async function updateCategory(id: string, input: UpdateCategoryInput): Promise<UpdateCategoryResponse> {
  await assertAdmin();

  try {
    const [updated] = await db
      .update(theoryCategoriesInApp)
      .set({
        name: input.name,
        isActive: input.isActive,
      })
      .where(eq(theoryCategoriesInApp.id, id))
      .returning({ id: theoryCategoriesInApp.id });

    if (!updated) {
      throw new NotFoundError('categoryNotFound');
    }

    return { id: updated.id };
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw error;
    }
    throw new DatabaseError('DATABASE_ERROR', { cause: error });
  }
}
