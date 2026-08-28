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
};

export type GetRepositoryResponse = {
  questions: RepositoryQuestionItem[];
  categories: RepositoryCategory[];
};
