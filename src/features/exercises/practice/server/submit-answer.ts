import 'server-only';

import { eq } from 'drizzle-orm';
import { db } from '@/lib/drizzle/client';
import { exerciseAttemptsInApp, exerciseChoicesInApp, exercisesInApp } from '@/lib/drizzle/schema';
import { DatabaseError, NotFoundError, ValidationError } from '@/lib/errors';
import { getAuthenticatedUser } from '@/lib/supabase/get-authenticated-user';
import type {
  ExercisePracticeAttemptResult,
  SubmitExerciseAnswerInput,
  SubmitExerciseAnswerResponse,
} from '@/features/exercises/practice/api/contracts';
import { assertExerciseInLibrary } from '@/features/exercises/practice/server/assert-exercise-in-library';
import { parseTiptapDocument } from '@/lib/tiptap/parse-document';

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

function gradeExerciseAnswer(
  selectedChoiceIds: string[],
  correctChoiceIds: string[],
): ExercisePracticeAttemptResult {
  const selected = new Set(selectedChoiceIds);
  const correct = new Set(correctChoiceIds);

  if (setsEqual(selected, correct)) {
    return 'correct';
  }

  const hasAnyCorrect = selectedChoiceIds.some((id) => correct.has(id));
  if (hasAnyCorrect) {
    return 'partial';
  }

  return 'incorrect';
}

export async function submitAnswer(
  exerciseId: string,
  input: SubmitExerciseAnswerInput,
): Promise<SubmitExerciseAnswerResponse> {
  const user = await getAuthenticatedUser();
  await assertExerciseInLibrary(user.id, exerciseId);

  try {
    const [exercise] = await db
      .select({
        id: exercisesInApp.id,
        explanation: exercisesInApp.explanation,
      })
      .from(exercisesInApp)
      .where(eq(exercisesInApp.id, exerciseId))
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
      .where(eq(exerciseChoicesInApp.exerciseId, exerciseId));

    const validChoiceIds = new Set(choiceRows.map((choice) => choice.id));
    const selectedChoiceIds = [...new Set(input.selectedChoiceIds)];

    if (!selectedChoiceIds.every((id) => validChoiceIds.has(id))) {
      throw new ValidationError('invalidChoices');
    }

    const correctChoiceIds = choiceRows.filter((choice) => choice.isCorrect).map((choice) => choice.id);
    const result = gradeExerciseAnswer(selectedChoiceIds, correctChoiceIds);

    const [created] = await db
      .insert(exerciseAttemptsInApp)
      .values({
        profileId: user.id,
        exerciseId,
        selectedChoiceIds,
        result,
      })
      .returning({ id: exerciseAttemptsInApp.id });

    if (!created) {
      throw new DatabaseError('DATABASE_ERROR');
    }

    return {
      attemptId: created.id,
      result,
      correctChoiceIds,
      explanation: exercise.explanation ? parseTiptapDocument(exercise.explanation) : null,
    };
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof ValidationError) {
      throw error;
    }
    throw new DatabaseError('DATABASE_ERROR', { cause: error });
  }
}
