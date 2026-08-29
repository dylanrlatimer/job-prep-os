import { z } from 'zod';
import type { JSONContent } from '@tiptap/core';
import type { ExerciseAttemptTotals, ExerciseTopic } from '@/features/exercises/repository/api/contracts';

export const ExercisePracticeParamsSchema = z.object({
  id: z.uuid(),
});

export type ExercisePracticeAttemptResult = 'incorrect' | 'partial' | 'correct';

export type ExercisePracticeAttemptHistoryItem = {
  id: string;
  result: ExercisePracticeAttemptResult;
  createdAt: string;
};

export type ExercisePracticeChoiceItem = {
  id: string;
  content: JSONContent;
  position: number;
};

export type ExercisePracticeResponse = {
  id: string;
  prompt: JSONContent;
  allowMultiple: boolean;
  choices: ExercisePracticeChoiceItem[];
  topics: ExerciseTopic[];
  sourceName: string | null;
  sourceUrl: string | null;
  attempts: ExerciseAttemptTotals;
  attemptHistory: ExercisePracticeAttemptHistoryItem[];
};

export const SubmitExerciseAnswerSchema = z.object({
  selectedChoiceIds: z.array(z.uuid()).min(1),
});

export type SubmitExerciseAnswerInput = {
  selectedChoiceIds: string[];
};

export type SubmitExerciseAnswerResponse = {
  attemptId: string;
  result: ExercisePracticeAttemptResult;
  correctChoiceIds: string[];
  explanation: JSONContent | null;
};
