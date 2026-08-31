import 'server-only';

import { and, asc, eq, sql } from 'drizzle-orm';
import { db } from '@/lib/drizzle/client';
import {
  exerciseChoicesInApp,
  exerciseTopicsInApp,
  exercisesInApp,
  practiceSessionItemsInApp,
  practiceSessionsInApp,
  theoryQuestionTopicsInApp,
  theoryQuestionsInApp,
  topicsInApp,
} from '@/lib/drizzle/schema';
import { AppError, DatabaseError } from '@/lib/errors';
import { getAuthenticatedUser } from '@/lib/supabase/get-authenticated-user';
import { parseTiptapDocument } from '@/lib/tiptap/parse-document';
import { assertSessionOwnedBy } from '@/features/practice/server/access';
import type {
  ContentFilter,
  ExerciseSessionItem,
  GetSessionResponse,
  SessionItem,
  SessionProgress,
  SessionTopic,
  TheorySessionItem,
} from '@/features/practice/sessions/api/contracts';

function asContentFilter(value: string): ContentFilter {
  if (value === 'theory' || value === 'exercises') {
    return value;
  }

  return 'all';
}

async function loadTheoryItem(item: { id: string; position: number; contentId: string }): Promise<TheorySessionItem | null> {
  const [question] = await db
    .select({
      id: theoryQuestionsInApp.id,
      question: theoryQuestionsInApp.question,
      sourceName: theoryQuestionsInApp.sourceName,
      sourceUrl: theoryQuestionsInApp.sourceUrl,
    })
    .from(theoryQuestionsInApp)
    .where(eq(theoryQuestionsInApp.id, item.contentId))
    .limit(1);

  if (!question) {
    return null;
  }

  const topicRows = await db
    .select({
      id: topicsInApp.id,
      name: topicsInApp.name,
      slug: topicsInApp.slug,
      iconKey: topicsInApp.iconKey,
    })
    .from(theoryQuestionTopicsInApp)
    .innerJoin(topicsInApp, eq(theoryQuestionTopicsInApp.topicId, topicsInApp.id))
    .where(eq(theoryQuestionTopicsInApp.questionId, item.contentId));

  const topics: SessionTopic[] = topicRows
    .map((row) => ({ id: row.id, name: row.name, slug: row.slug, iconKey: row.iconKey }))
    .sort((left, right) => left.name.localeCompare(right.name));

  return {
    id: item.id,
    position: item.position,
    contentType: 'theory',
    content: {
      id: question.id,
      question: question.question,
      topics,
      sourceName: question.sourceName,
      sourceUrl: question.sourceUrl,
    },
  };
}

async function loadExerciseItem(item: { id: string; position: number; contentId: string }): Promise<ExerciseSessionItem | null> {
  const [exercise] = await db
    .select({
      id: exercisesInApp.id,
      title: exercisesInApp.title,
      prompt: exercisesInApp.prompt,
      allowMultiple: exercisesInApp.allowMultiple,
      sourceName: exercisesInApp.sourceName,
      sourceUrl: exercisesInApp.sourceUrl,
    })
    .from(exercisesInApp)
    .where(eq(exercisesInApp.id, item.contentId))
    .limit(1);

  if (!exercise) {
    return null;
  }

  const [choiceRows, topicRows] = await Promise.all([
    db
      .select({
        id: exerciseChoicesInApp.id,
        content: exerciseChoicesInApp.content,
        position: exerciseChoicesInApp.position,
      })
      .from(exerciseChoicesInApp)
      .where(eq(exerciseChoicesInApp.exerciseId, item.contentId))
      .orderBy(asc(exerciseChoicesInApp.position)),
    db
      .select({
        id: topicsInApp.id,
        name: topicsInApp.name,
        slug: topicsInApp.slug,
        iconKey: topicsInApp.iconKey,
      })
      .from(exerciseTopicsInApp)
      .innerJoin(topicsInApp, eq(exerciseTopicsInApp.topicId, topicsInApp.id))
      .where(eq(exerciseTopicsInApp.exerciseId, item.contentId)),
  ]);

  const topics: SessionTopic[] = topicRows
    .map((row) => ({ id: row.id, name: row.name, slug: row.slug, iconKey: row.iconKey }))
    .sort((left, right) => left.name.localeCompare(right.name));

  return {
    id: item.id,
    position: item.position,
    contentType: 'exercise',
    content: {
      id: exercise.id,
      title: exercise.title,
      prompt: parseTiptapDocument(exercise.prompt),
      allowMultiple: exercise.allowMultiple,
      choices: choiceRows.map((choice) => ({
        id: choice.id,
        content: parseTiptapDocument(choice.content),
        position: choice.position,
      })),
      topics,
      sourceName: exercise.sourceName,
      sourceUrl: exercise.sourceUrl,
    },
  };
}

export async function getSession(sessionId: string): Promise<GetSessionResponse> {
  const user = await getAuthenticatedUser();

  try {
    const [session] = await db
      .select({
        id: practiceSessionsInApp.id,
        profileId: practiceSessionsInApp.profileId,
        status: practiceSessionsInApp.status,
        topicIds: practiceSessionsInApp.topicIds,
        contentFilter: practiceSessionsInApp.contentFilter,
      })
      .from(practiceSessionsInApp)
      .where(eq(practiceSessionsInApp.id, sessionId))
      .limit(1);

    assertSessionOwnedBy(user.id, session);

    const [progressRow] = await db
      .select({
        total: sql<number>`count(*)`,
        answered: sql<number>`count(${practiceSessionItemsInApp.answeredAt})`,
        skipped: sql<number>`sum(case when ${practiceSessionItemsInApp.skipped} then 1 else 0 end)`,
      })
      .from(practiceSessionItemsInApp)
      .where(eq(practiceSessionItemsInApp.sessionId, sessionId));

    const progress: SessionProgress = {
      total: Number(progressRow?.total ?? 0),
      answered: Number(progressRow?.answered ?? 0),
      skipped: Number(progressRow?.skipped ?? 0),
    };

    if (session.status === 'completed') {
      return {
        id: session.id,
        status: 'completed',
        topicIds: session.topicIds,
        contentFilter: asContentFilter(session.contentFilter),
        progress,
        currentItem: null,
        unavailableItemId: null,
      };
    }

    const [pendingItem] = await db
      .select({
        id: practiceSessionItemsInApp.id,
        position: practiceSessionItemsInApp.position,
        contentType: practiceSessionItemsInApp.contentType,
        contentId: practiceSessionItemsInApp.contentId,
      })
      .from(practiceSessionItemsInApp)
      .where(
        and(
          eq(practiceSessionItemsInApp.sessionId, sessionId),
          eq(practiceSessionItemsInApp.skipped, false),
          sql`${practiceSessionItemsInApp.answeredAt} is null`,
        ),
      )
      .orderBy(asc(practiceSessionItemsInApp.position))
      .limit(1);

    if (!pendingItem) {
      return {
        id: session.id,
        status: session.status,
        topicIds: session.topicIds,
        contentFilter: asContentFilter(session.contentFilter),
        progress,
        currentItem: null,
        unavailableItemId: null,
      };
    }

    const currentItem: SessionItem | null = pendingItem.contentType === 'theory' ? await loadTheoryItem(pendingItem) : await loadExerciseItem(pendingItem);

    return {
      id: session.id,
      status: session.status,
      topicIds: session.topicIds,
      contentFilter: asContentFilter(session.contentFilter),
      progress,
      currentItem,
      unavailableItemId: currentItem ? null : pendingItem.id,
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new DatabaseError('DATABASE_ERROR', { cause: error });
  }
}
