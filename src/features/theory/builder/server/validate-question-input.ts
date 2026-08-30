import 'server-only';

import { inArray } from 'drizzle-orm';
import { db } from '@/lib/drizzle/client';
import { topicsInApp } from '@/lib/drizzle/schema';
import { ValidationError } from '@/lib/errors';
import type { QuestionInput } from '@/features/theory/builder/api/contracts';

export async function validateQuestionInput(input: QuestionInput): Promise<void> {
  const uniqueTopicIds = [...new Set(input.topicIds)];
  if (uniqueTopicIds.length === 0) return;

  const topics = await db
    .select({ id: topicsInApp.id })
    .from(topicsInApp)
    .where(inArray(topicsInApp.id, uniqueTopicIds));

  if (topics.length !== uniqueTopicIds.length) {
    throw new ValidationError('invalidTopics');
  }
}
