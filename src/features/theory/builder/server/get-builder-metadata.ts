import 'server-only';

import { asc, eq } from 'drizzle-orm';
import { db } from '@/lib/drizzle/client';
import { theoryCategoriesInApp } from '@/lib/drizzle/schema';
import { DatabaseError } from '@/lib/errors';
import { getAuthenticatedUser } from '@/lib/supabase/get-authenticated-user';
import type { BuilderMetadataResponse } from '@/features/theory/builder/api/contracts';

export async function getBuilderMetadata(): Promise<BuilderMetadataResponse> {
  await getAuthenticatedUser();

  try {
    const categories = await db
      .select({
        id: theoryCategoriesInApp.id,
        name: theoryCategoriesInApp.name,
        slug: theoryCategoriesInApp.slug,
      })
      .from(theoryCategoriesInApp)
      .where(eq(theoryCategoriesInApp.isActive, true))
      .orderBy(asc(theoryCategoriesInApp.name));

    return { categories };
  } catch (error) {
    throw new DatabaseError('DATABASE_ERROR', { cause: error });
  }
}
