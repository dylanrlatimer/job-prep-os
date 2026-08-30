import { z } from 'zod';
import type { JSONContent } from '@tiptap/core';
import type { RepositoryAttemptTotals, RepositoryTopic } from '@/features/theory/repository/api/contracts';

export const PracticeQuestionParamsSchema = z.object({
  id: z.uuid(),
});

export type PracticeAttemptResult = 'incorrect' | 'partial' | 'correct';

export type PracticeAttempt = {
  id: string;
  response: JSONContent | null;
  result: PracticeAttemptResult;
  notes: JSONContent | null;
  createdAt: string;
};

export type PracticeQuestionResponse = {
  id: string;
  question: string;
  topics: RepositoryTopic[];
  sourceName: string | null;
  sourceUrl: string | null;
};

export type PracticeReviewResponse = {
  answer: JSONContent;
  attempts: RepositoryAttemptTotals;
  attemptHistory: PracticeAttempt[];
};

const optionalTiptapDoc = z
  .union([
    z.object({ type: z.string(), content: z.array(z.any()) }).passthrough(),
    z.null(),
    z.undefined(),
  ])
  .transform((val) => val ?? null);

export const CreateAttemptSchema = z.object({
  result: z.enum(['incorrect', 'partial', 'correct']),
  response: optionalTiptapDoc,
  notes: optionalTiptapDoc,
});

export type CreateAttemptInput = {
  result: 'incorrect' | 'partial' | 'correct';
  response: JSONContent | null;
  notes: JSONContent | null;
};

export type CreateAttemptResponse = {
  id: string;
};
