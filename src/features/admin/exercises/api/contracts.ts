import { z } from 'zod';
import type { JSONContent } from '@tiptap/core';
import { ListPageSchema, optionalListSearchSchema, optionalListTopicIdSchema, type ListPageMeta } from '@/common/lib/pagination';
import type { PublicationFilter } from '@/common/lib/list-filters';
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
  title: string;
  isPublic: boolean;
  topics: ExerciseTopic[];
  updatedAt: string;
};

export const SystemExerciseListQuerySchema = ListPageSchema.extend({
  search: optionalListSearchSchema,
  topicId: optionalListTopicIdSchema,
  publication: z.enum(['all', 'published', 'draft']).optional().default('all'),
});

export type SystemExerciseListQuery = Omit<z.infer<typeof SystemExerciseListQuerySchema>, 'publication'> & {
  publication: PublicationFilter;
};

export type ListSystemExercisesResponse = {
  exercises: SystemExerciseListItem[];
  topics: ExerciseTopic[];
} & ListPageMeta;

export type SystemExerciseChoiceResponse = {
  content: JSONContent;
  isCorrect: boolean;
};

export type SystemExerciseResponse = {
  id: string;
  title: string;
  prompt: JSONContent;
  explanation: JSONContent | null;
  topicIds: string[];
  topics: ExerciseTopic[];
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
