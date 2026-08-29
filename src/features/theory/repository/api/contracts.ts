import { z } from 'zod';

export type RepositoryCategory = {
  id: string;
  name: string;
  slug: string;
};

export type RepositoryAttemptTotals = {
  incorrect: number;
  partial: number;
  correct: number;
};

export type RepositoryQuestionItem = {
  id: string;
  question: string;
  categories: RepositoryCategory[];
  attempts: RepositoryAttemptTotals;
  canUnsave: boolean;
};

export type GetRepositoryResponse = {
  questions: RepositoryQuestionItem[];
  categories: RepositoryCategory[];
};

export const UnsaveRepositoryQuestionParamsSchema = z.object({
  id: z.uuid(),
});

export type UnsaveRepositoryQuestionResponse = {
  questionId: string;
};
