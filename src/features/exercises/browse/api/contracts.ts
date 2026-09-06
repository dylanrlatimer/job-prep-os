import { z } from 'zod';
import type { JSONContent } from '@tiptap/core';
import { ListPageSchema, optionalListSearchSchema, optionalListTopicIdSchema, type ListPageMeta } from '@/common/lib/pagination';
import type { BrowseSavedFilter } from '@/features/theory/browse/lib/browse-filters';
import type { ExerciseTopic } from '@/features/exercises/repository/api/contracts';

export type BrowseExerciseItem = {
  id: string;
  title: string;
  topics: ExerciseTopic[];
  isSaved: boolean;
  isSystem: boolean;
  createdAt: string;
};

export const BrowseExerciseListQuerySchema = ListPageSchema.extend({
  search: optionalListSearchSchema,
  topicId: optionalListTopicIdSchema,
  saved: z.enum(['all', 'new', 'saved']).optional().default('new'),
});

export type BrowseExerciseListQuery = Omit<z.infer<typeof BrowseExerciseListQuerySchema>, 'saved'> & {
  saved: BrowseSavedFilter;
};

export type GetBrowseExercisesResponse = {
  exercises: BrowseExerciseItem[];
  topics: ExerciseTopic[];
} & ListPageMeta;

export type SaveExerciseResponse = {
  exerciseId: string;
};

export const BrowseExerciseDetailParamsSchema = z.object({
  id: z.uuid(),
});

export type BrowseExerciseDetailResponse = {
  id: string;
  title: string;
  prompt: JSONContent;
  topics: ExerciseTopic[];
  sourceName: string | null;
  sourceUrl: string | null;
  isSaved: boolean;
  isSystem: boolean;
  choiceCount: number;
};
