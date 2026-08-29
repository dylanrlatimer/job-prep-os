import { z } from 'zod';
import type { JSONContent } from '@tiptap/core';
import type { ExerciseTopic } from '@/features/exercises/repository/api/contracts';

export type BrowseExerciseItem = {
  id: string;
  prompt: string;
  topics: ExerciseTopic[];
  isSaved: boolean;
  isSystem: boolean;
};

export type GetBrowseExercisesResponse = {
  exercises: BrowseExerciseItem[];
  topics: ExerciseTopic[];
};

export type SaveExerciseResponse = {
  exerciseId: string;
};

export const BrowseExerciseDetailParamsSchema = z.object({
  id: z.uuid(),
});

export type BrowseExerciseDetailResponse = {
  id: string;
  prompt: JSONContent;
  topics: ExerciseTopic[];
  sourceName: string | null;
  sourceUrl: string | null;
  isSaved: boolean;
  isSystem: boolean;
  choiceCount: number;
};
