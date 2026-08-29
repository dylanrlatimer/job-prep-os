import { z } from 'zod';

export type ExerciseTopic = {
  id: string;
  name: string;
  slug: string;
};

export type ExerciseAttemptTotals = {
  incorrect: number;
  partial: number;
  correct: number;
};

export type RepositoryExerciseItem = {
  id: string;
  prompt: string;
  topics: ExerciseTopic[];
  attempts: ExerciseAttemptTotals;
  canUnsave: boolean;
};

export type GetExerciseRepositoryResponse = {
  exercises: RepositoryExerciseItem[];
  topics: ExerciseTopic[];
};

export const UnsaveExerciseParamsSchema = z.object({
  id: z.uuid(),
});

export type UnsaveExerciseResponse = {
  exerciseId: string;
};
