import { z } from 'zod';
import type { JSONContent } from '@tiptap/core';
import { ExerciseInputSchema } from '@/features/exercises/builder/api/contracts';
import type { ExerciseTopic } from '@/features/exercises/repository/api/contracts';

export const SystemExerciseInputSchema = ExerciseInputSchema;
export type SystemExerciseInput = z.infer<typeof SystemExerciseInputSchema>;

export const CreateSystemExerciseSchema = SystemExerciseInputSchema;
export type CreateSystemExerciseInput = z.infer<typeof CreateSystemExerciseSchema>;

export const UpdateSystemExerciseSchema = SystemExerciseInputSchema;
export type UpdateSystemExerciseInput = z.infer<typeof UpdateSystemExerciseSchema>;

export const GetSystemExerciseParamsSchema = z.object({
  id: z.uuid(),
});

export type SystemExerciseListItem = {
  id: string;
  prompt: string;
  isPublic: boolean;
  topics: ExerciseTopic[];
  updatedAt: string;
};

export type ListSystemExercisesResponse = {
  exercises: SystemExerciseListItem[];
  topics: ExerciseTopic[];
};

export type SystemExerciseChoiceResponse = {
  content: JSONContent;
  isCorrect: boolean;
};

export type SystemExerciseResponse = {
  id: string;
  prompt: JSONContent;
  explanation: JSONContent | null;
  topicIds: string[];
  sourceName: string | null;
  sourceUrl: string | null;
  isPublic: boolean;
  allowMultiple: boolean;
  choices: SystemExerciseChoiceResponse[];
};

export type CreateSystemExerciseResponse = {
  id: string;
};

export type UpdateSystemExerciseResponse = {
  id: string;
};

export type DeleteSystemExerciseResponse = {
  id: string;
};
