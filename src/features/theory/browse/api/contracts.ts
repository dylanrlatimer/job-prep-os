import { z } from 'zod';
import type { JSONContent } from '@tiptap/core';
import { ListPageSchema, optionalListSearchSchema, optionalListTopicIdSchema, type ListPageMeta } from '@/common/lib/pagination';
import type { BrowseSavedFilter } from '@/features/theory/browse/lib/browse-filters';
import type { RepositoryTopic } from '@/features/theory/repository/api/contracts';
import type { BrowseExerciseItem } from '@/features/exercises/browse/api/contracts';

export type BrowseQuestionItem = {
  id: string;
  question: string;
  topics: RepositoryTopic[];
  isSaved: boolean;
  isSystem: boolean;
  createdAt: string;
};

export const BrowseListQuerySchema = ListPageSchema.extend({
  search: optionalListSearchSchema,
  topicId: optionalListTopicIdSchema,
  saved: z.enum(['all', 'new', 'saved']).optional().default('new'),
});

export type BrowseListQuery = Omit<z.infer<typeof BrowseListQuerySchema>, 'saved'> & {
  saved: BrowseSavedFilter;
};

export type GetBrowseResponse = {
  questions: BrowseQuestionItem[];
  topics: RepositoryTopic[];
} & ListPageMeta;

export type BrowseAllItem = { type: 'question'; item: BrowseQuestionItem } | { type: 'exercise'; item: BrowseExerciseItem };

export type GetBrowseAllResponse = {
  items: BrowseAllItem[];
  topics: RepositoryTopic[];
} & ListPageMeta;

export type SaveBrowseQuestionResponse = {
  questionId: string;
};

export const BrowseQuestionDetailParamsSchema = z.object({
  id: z.uuid(),
});

export type BrowseQuestionDetailResponse = {
  id: string;
  question: string;
  answer: JSONContent;
  topics: RepositoryTopic[];
  sourceName: string | null;
  sourceUrl: string | null;
  isSaved: boolean;
  isSystem: boolean;
};
