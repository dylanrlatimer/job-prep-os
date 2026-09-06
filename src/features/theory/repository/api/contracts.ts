import { z } from 'zod';
import { ListPageSchema, optionalListSearchSchema, optionalListTopicIdSchema, type ListPageMeta } from '@/common/lib/pagination';

export type RepositoryTopic = {
  id: string;
  name: string;
  slug: string;
  iconKey: string | null;
};

export type RepositoryAttemptTotals = {
  incorrect: number;
  partial: number;
  correct: number;
};

export type RepositoryQuestionItem = {
  id: string;
  question: string;
  topics: RepositoryTopic[];
  attempts: RepositoryAttemptTotals;
  canUnsave: boolean;
};

export const RepositoryListQuerySchema = ListPageSchema.extend({
  search: optionalListSearchSchema,
  topicId: optionalListTopicIdSchema,
});

export type RepositoryListQuery = z.infer<typeof RepositoryListQuerySchema>;

export type GetRepositoryResponse = {
  questions: RepositoryQuestionItem[];
  topics: RepositoryTopic[];
} & ListPageMeta;

export const UnsaveRepositoryQuestionParamsSchema = z.object({
  id: z.uuid(),
});

export type UnsaveRepositoryQuestionResponse = {
  questionId: string;
};
