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
