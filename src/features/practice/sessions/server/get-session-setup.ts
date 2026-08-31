import 'server-only';

import { and, asc, eq, inArray } from 'drizzle-orm';
import { db } from '@/lib/drizzle/client';
import { exerciseLibraryItemsInApp, exerciseTopicsInApp, theoryLibraryItemsInApp, theoryQuestionTopicsInApp, topicsInApp } from '@/lib/drizzle/schema';
import { DatabaseError } from '@/lib/errors';
import { getAuthenticatedUser } from '@/lib/supabase/get-authenticated-user';
import { exerciseAccess } from '@/features/exercises/server/access';
import { questionAccess } from '@/features/theory/server/access';
import type { GetSessionSetupResponse, SessionTopic } from '@/features/practice/sessions/api/contracts';

export async function getSessionSetup(): Promise<GetSessionSetupResponse> {
  const user = await getAuthenticatedUser();

  try {
    const [theoryTopicRows, exerciseTopicRows] = await Promise.all([
      db
        .selectDistinct({ topicId: theoryQuestionTopicsInApp.topicId })
        .from(theoryLibraryItemsInApp)
        .innerJoin(theoryQuestionTopicsInApp, eq(theoryLibraryItemsInApp.questionId, theoryQuestionTopicsInApp.questionId))
        .where(questionAccess.inLibrary(user.id)),
      db
        .selectDistinct({ topicId: exerciseTopicsInApp.topicId })
        .from(exerciseLibraryItemsInApp)
        .innerJoin(exerciseTopicsInApp, eq(exerciseLibraryItemsInApp.exerciseId, exerciseTopicsInApp.exerciseId))
        .where(exerciseAccess.inLibrary(user.id)),
    ]);

    const topicIds = [...new Set([...theoryTopicRows, ...exerciseTopicRows].map((row) => row.topicId))];

    if (topicIds.length === 0) {
      return { topics: [] };
    }

    const topics: SessionTopic[] = await db
      .select({
        id: topicsInApp.id,
        name: topicsInApp.name,
        slug: topicsInApp.slug,
        iconKey: topicsInApp.iconKey,
      })
      .from(topicsInApp)
      .where(and(inArray(topicsInApp.id, topicIds), eq(topicsInApp.isActive, true)))
      .orderBy(asc(topicsInApp.name));

    return { topics };
  } catch (error) {
    throw new DatabaseError('DATABASE_ERROR', { cause: error });
  }
}
