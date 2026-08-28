import 'server-only';

import { inArray } from 'drizzle-orm';
import { db } from '@/lib/drizzle/client';
import { theoryCategoriesInApp } from '@/lib/drizzle/schema';
import { ValidationError } from '@/lib/errors';
import type { QuestionInput } from '@/features/theory/builder/api/contracts';

export async function validateQuestionInput(input: QuestionInput): Promise<void> {
  const uniqueCategoryIds = [...new Set(input.categoryIds)];
  if (uniqueCategoryIds.length === 0) return;

  const categories = await db
    .select({ id: theoryCategoriesInApp.id })
    .from(theoryCategoriesInApp)
    .where(inArray(theoryCategoriesInApp.id, uniqueCategoryIds));

  if (categories.length !== uniqueCategoryIds.length) {
    throw new ValidationError('invalidCategories');
  }
}
