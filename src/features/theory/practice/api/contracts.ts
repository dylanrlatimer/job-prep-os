import { z } from 'zod';
import type { JSONContent } from '@tiptap/core';
import type { RepositoryAttemptTotals, RepositoryCategory } from '@/features/theory/repository/api/contracts';

export const PracticeQuestionParamsSchema = z.object({
  id: z.uuid(),
});

export type PracticeAttemptResult = 'incorrect' | 'partial' | 'correct';

export type PracticeAttempt = {
  id: string;
  response: string | null;
  result: PracticeAttemptResult;
  notes: string | null;
  createdAt: string;
};

export type PracticeQuestionResponse = {
  id: string;
  question: string;
  categories: RepositoryCategory[];
  sourceName: string | null;
  sourceUrl: string | null;
};

export type PracticeReviewResponse = {
  answer: JSONContent;
  attempts: RepositoryAttemptTotals;
  attemptHistory: PracticeAttempt[];
};

function optionalTrimmedText(maxLength: number) {
  return z
    .union([z.string(), z.null(), z.undefined()])
    .transform((value) => {
      const trimmed = (value ?? '').trim();
      return trimmed.length > 0 ? trimmed : null;
    })
    .pipe(z.union([z.string().max(maxLength), z.null()]));
}

export const CreateAttemptSchema = z.object({
  result: z.enum(['incorrect', 'partial', 'correct']),
  response: optionalTrimmedText(10_000),
  notes: optionalTrimmedText(5_000),
});

export type CreateAttemptInput = z.infer<typeof CreateAttemptSchema>;

export type CreateAttemptResponse = {
  id: string;
};
