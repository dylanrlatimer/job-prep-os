import { z } from 'zod';
import type { PracticeAttempt } from '@/features/theory/practice/api/contracts';
import type { RepositoryAttemptTotals, RepositoryCategory } from '@/features/theory/repository/api/contracts';

export const QuestionDetailParamsSchema = z.object({
  id: z.uuid(),
});

export type QuestionDetailResponse = {
  id: string;
  question: string;
  answer: string;
  categories: RepositoryCategory[];
  sourceName: string | null;
  sourceUrl: string | null;
  isPublic: boolean;
  isOwner: boolean;
  attempts: RepositoryAttemptTotals;
  attemptHistory: PracticeAttempt[];
};
