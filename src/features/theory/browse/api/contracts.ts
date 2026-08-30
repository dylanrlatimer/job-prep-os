import { z } from 'zod';
import type { JSONContent } from '@tiptap/core';
import type { RepositoryTopic } from '@/features/theory/repository/api/contracts';

export type BrowseQuestionItem = {
  id: string;
  question: string;
  topics: RepositoryTopic[];
  isSaved: boolean;
  isSystem: boolean;
};

export type GetBrowseResponse = {
  questions: BrowseQuestionItem[];
  topics: RepositoryTopic[];
};

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
