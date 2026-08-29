import { z } from 'zod';
import type { JSONContent } from '@tiptap/core';
import type { RepositoryAttemptTotals } from '@/features/theory/repository/api/contracts';

export const ExerciseDetailParamsSchema = z.object({
  id: z.uuid(),
});

export type ExerciseAttemptResult = 'incorrect' | 'partial' | 'correct';

export type ExerciseAttemptHistoryItem = {
  id: string;
  selectedChoiceIds: string[];
  result: ExerciseAttemptResult;
  createdAt: string;
};

export type ExerciseDetailChoiceItem = {
  id: string;
  content: JSONContent;
  isCorrect: boolean;
  position: number;
};

export type ExerciseDetailTopic = {
  id: string;
  name: string;
  slug: string;
};

export type ExerciseDetailResponse = {
  id: string;
  title: string;
  prompt: JSONContent;
  explanation: JSONContent | null;
  choices: ExerciseDetailChoiceItem[];
  topics: ExerciseDetailTopic[];
  sourceName: string | null;
  sourceUrl: string | null;
  isOwner: boolean;
  attempts: RepositoryAttemptTotals;
  attemptHistory: ExerciseAttemptHistoryItem[];
};
