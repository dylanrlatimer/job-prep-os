import { z } from 'zod';
import { ListPageSchema, optionalListSearchSchema, optionalListTopicIdSchema, type ListPageMeta } from '@/common/lib/pagination';

export type ExerciseTopic = {
  id: string;
  name: string;
  slug: string;
  iconKey: string | null;
};

export type ExerciseAttemptTotals = {
  incorrect: number;
  partial: number;
  correct: number;
};

export type RepositoryExerciseItem = {
  id: string;
  title: string;
  topics: ExerciseTopic[];
  attempts: ExerciseAttemptTotals;
  canUnsave: boolean;
};

export const ExerciseRepositoryListQuerySchema = ListPageSchema.extend({
  search: optionalListSearchSchema,
  topicId: optionalListTopicIdSchema,
});

export type ExerciseRepositoryListQuery = z.infer<typeof ExerciseRepositoryListQuerySchema>;

export type GetExerciseRepositoryResponse = {
  exercises: RepositoryExerciseItem[];
  topics: ExerciseTopic[];
} & ListPageMeta;

export const UnsaveExerciseParamsSchema = z.object({
  id: z.uuid(),
});

export type UnsaveExerciseResponse = {
  exerciseId: string;
};
