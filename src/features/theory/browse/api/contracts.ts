import { z } from 'zod';
import type { JSONContent } from '@tiptap/core';
import type { RepositoryCategory } from '@/features/theory/repository/api/contracts';

export type BrowseQuestionItem = {
  id: string;
  question: string;
  categories: RepositoryCategory[];
  isSaved: boolean;
  isSystem: boolean;
};

export type GetBrowseResponse = {
  questions: BrowseQuestionItem[];
  categories: RepositoryCategory[];
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
  categories: RepositoryCategory[];
  sourceName: string | null;
  sourceUrl: string | null;
  isSaved: boolean;
  isSystem: boolean;
};
