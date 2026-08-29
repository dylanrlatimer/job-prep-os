import 'server-only';

import { count, eq } from 'drizzle-orm';
import { db } from '@/lib/drizzle/client';
import { topicsInApp, theoryQuestionTopicsInApp } from '@/lib/drizzle/schema';
import { DatabaseError, NotFoundError, ValidationError } from '@/lib/errors';
import { assertAdmin } from '@/features/auth/server/assert-admin';
import type { DeleteCategoryResponse } from '@/features/admin/categories/api/contracts';

export async function deleteCategory(id: string): Promise<DeleteCategoryResponse> {
  await assertAdmin();

  try {
    const [category] = await db
      .select({ id: topicsInApp.id })
      .from(topicsInApp)
      .where(eq(topicsInApp.id, id))
      .limit(1);

    if (!category) {
      throw new NotFoundError('categoryNotFound');
    }

    const [usage] = await db
      .select({ questionCount: count() })
      .from(theoryQuestionTopicsInApp)
      .where(eq(theoryQuestionTopicsInApp.topicId, id));

    if (Number(usage?.questionCount ?? 0) > 0) {
      throw new ValidationError('categoryInUse');
    }

    await db.delete(topicsInApp).where(eq(topicsInApp.id, id));

    return { id };
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof ValidationError) {
      throw error;
    }
    throw new DatabaseError('DATABASE_ERROR', { cause: error });
  }
}
