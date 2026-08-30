import 'server-only';

import { eq } from 'drizzle-orm';
import { db } from '@/lib/drizzle/client';
import { topicsInApp } from '@/lib/drizzle/schema';
import { DatabaseError, ValidationError } from '@/lib/errors';
import { slugify } from '@/common/lib/slugify';
import { assertAdmin } from '@/features/auth/server/assert-admin';
import type { CreateTopicResponse, TopicInput } from '@/features/admin/topics/api/contracts';

async function uniqueSlug(baseSlug: string) {
  let slug = baseSlug;
  let suffix = 2;

  while (true) {
    const [existing] = await db.select({ id: topicsInApp.id }).from(topicsInApp).where(eq(topicsInApp.slug, slug)).limit(1);

    if (!existing) {
      return slug;
    }

    slug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }
}

export async function createTopic(input: TopicInput): Promise<CreateTopicResponse> {
  await assertAdmin();

  const baseSlug = slugify(input.name);
  if (!baseSlug) {
    throw new ValidationError('topicNameRequired');
  }

  try {
    const slug = await uniqueSlug(baseSlug);

    const [created] = await db
      .insert(topicsInApp)
      .values({
        name: input.name,
        slug,
        iconKey: input.iconKey,
      })
      .returning({ id: topicsInApp.id });

    if (!created) {
      throw new DatabaseError('DATABASE_ERROR');
    }

    return { id: created.id };
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }
    throw new DatabaseError('DATABASE_ERROR', { cause: error });
  }
}
