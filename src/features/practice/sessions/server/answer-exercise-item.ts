import 'server-only';

import { and, eq } from 'drizzle-orm';
import { db } from '@/lib/drizzle/client';
import { exerciseAttemptsInApp, exerciseChoicesInApp, exercisesInApp, practiceSessionItemsInApp } from '@/lib/drizzle/schema';
import { DatabaseError, NotFoundError, ValidationError } from '@/lib/errors';
import { parseTiptapDocument } from '@/lib/tiptap/parse-document';
import type { AnswerExerciseItemInput, AnswerExerciseItemResponse, AttemptResult } from '@/features/practice/sessions/api/contracts';
import { completeSessionIfDone } from './complete-session-if-done';

function setsEqual<T>(left: Set<T>, right: Set<T>): boolean {
  if (left.size !== right.size) {
    return false;
  }

  for (const value of left) {
    if (!right.has(value)) {
      return false;
    }
  }

  return true;
}

function gradeExerciseAnswer(selectedChoiceIds: string[], correctChoiceIds: string[]): AttemptResult {
  const selected = new Set(selectedChoiceIds);
  const correct = new Set(correctChoiceIds);

  if (setsEqual(selected, correct)) {
    return 'correct';
  }

  if (selectedChoiceIds.some((id) => correct.has(id))) {
    return 'partial';
  }

  return 'incorrect';
}

export async function answerExerciseItem(
  sessionId: string,
  itemId: string,
  input: AnswerExerciseItemInput,
  userId: string,
): Promise<AnswerExerciseItemResponse> {
  const [item] = await db
    .select({
      id: practiceSessionItemsInApp.id,
      contentType: practiceSessionItemsInApp.contentType,
      contentId: practiceSessionItemsInApp.contentId,
      answeredAt: practiceSessionItemsInApp.answeredAt,
      skipped: practiceSessionItemsInApp.skipped,
    })
    .from(practiceSessionItemsInApp)
    .where(and(eq(practiceSessionItemsInApp.id, itemId), eq(practiceSessionItemsInApp.sessionId, sessionId)))
    .limit(1);

  if (!item) {
    throw new NotFoundError('sessionItemNotFound');
  }

  if (item.contentType !== 'exercise') {
    throw new ValidationError('wrongContentType');
  }

  if (item.answeredAt || item.skipped) {
    throw new ValidationError('itemAlreadyDone');
  }

  try {
    const [exercise] = await db
      .select({
        id: exercisesInApp.id,
        explanation: exercisesInApp.explanation,
      })
      .from(exercisesInApp)
      .where(eq(exercisesInApp.id, item.contentId))
      .limit(1);

    if (!exercise) {
      throw new NotFoundError('exerciseNotFound');
    }

    const choiceRows = await db
      .select({
        id: exerciseChoicesInApp.id,
        isCorrect: exerciseChoicesInApp.isCorrect,
      })
      .from(exerciseChoicesInApp)
      .where(eq(exerciseChoicesInApp.exerciseId, item.contentId));

    const validChoiceIds = new Set(choiceRows.map((choice) => choice.id));
    const selectedChoiceIds = [...new Set(input.selectedChoiceIds)];

    if (!selectedChoiceIds.every((id) => validChoiceIds.has(id))) {
      throw new ValidationError('invalidChoices');
    }

    const correctChoiceIds = choiceRows.filter((choice) => choice.isCorrect).map((choice) => choice.id);
    const result = gradeExerciseAnswer(selectedChoiceIds, correctChoiceIds);

    const attemptId = await db.transaction(async (tx) => {
      const [created] = await tx
        .insert(exerciseAttemptsInApp)
        .values({
          profileId: userId,
          exerciseId: item.contentId,
          selectedChoiceIds,
          result,
        })
        .returning({ id: exerciseAttemptsInApp.id });

      if (!created) {
        throw new DatabaseError('DATABASE_ERROR');
      }

      await tx
        .update(practiceSessionItemsInApp)
        .set({
          exerciseAttemptId: created.id,
          answeredAt: new Date().toISOString(),
        })
        .where(eq(practiceSessionItemsInApp.id, itemId));

      return created.id;
    });

    const sessionComplete = await completeSessionIfDone(sessionId);

    return {
      attemptId,
      result,
      correctChoiceIds,
      explanation: exercise.explanation ? parseTiptapDocument(exercise.explanation) : null,
      sessionComplete,
    };
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof ValidationError) {
      throw error;
    }
    throw new DatabaseError('DATABASE_ERROR', { cause: error });
  }
}
