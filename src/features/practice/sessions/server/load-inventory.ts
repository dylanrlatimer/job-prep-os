import 'server-only';

import { and, inArray, eq } from 'drizzle-orm';
import { db } from '@/lib/drizzle/client';
import { exerciseLibraryItemsInApp, exerciseTopicsInApp, theoryLibraryItemsInApp, theoryQuestionTopicsInApp } from '@/lib/drizzle/schema';
import { exerciseAccess } from '@/features/exercises/server/access';
import { questionAccess } from '@/features/theory/server/access';

export type TopicInventory = {
  theory: string[];
  exercise: string[];
};

export type Inventory = Map<string, TopicInventory>;

export async function loadInventory(userId: string, topicIds: string[]): Promise<Inventory> {
  const inventory: Inventory = new Map();

  for (const topicId of topicIds) {
    inventory.set(topicId, { theory: [], exercise: [] });
  }

  if (topicIds.length === 0) {
    return inventory;
  }

  const [theoryRows, exerciseRows] = await Promise.all([
    db
      .selectDistinct({
        topicId: theoryQuestionTopicsInApp.topicId,
        questionId: theoryLibraryItemsInApp.questionId,
      })
      .from(theoryLibraryItemsInApp)
      .innerJoin(theoryQuestionTopicsInApp, eq(theoryLibraryItemsInApp.questionId, theoryQuestionTopicsInApp.questionId))
      .where(and(questionAccess.inLibrary(userId), inArray(theoryQuestionTopicsInApp.topicId, topicIds))),
    db
      .selectDistinct({
        topicId: exerciseTopicsInApp.topicId,
        exerciseId: exerciseLibraryItemsInApp.exerciseId,
      })
      .from(exerciseLibraryItemsInApp)
      .innerJoin(exerciseTopicsInApp, eq(exerciseLibraryItemsInApp.exerciseId, exerciseTopicsInApp.exerciseId))
      .where(and(exerciseAccess.inLibrary(userId), inArray(exerciseTopicsInApp.topicId, topicIds))),
  ]);

  for (const row of theoryRows) {
    inventory.get(row.topicId)?.theory.push(row.questionId);
  }

  for (const row of exerciseRows) {
    inventory.get(row.topicId)?.exercise.push(row.exerciseId);
  }

  return inventory;
}
