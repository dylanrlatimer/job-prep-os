import { z } from 'zod';

export type RepositoryTopic = {
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
  topics: RepositoryTopic[];
  attempts: RepositoryAttemptTotals;
  canUnsave: boolean;
};

export type GetRepositoryResponse = {
  questions: RepositoryQuestionItem[];
  topics: RepositoryTopic[];
};

export const UnsaveRepositoryQuestionParamsSchema = z.object({
  id: z.uuid(),
});

export type UnsaveRepositoryQuestionResponse = {
  questionId: string;
};
