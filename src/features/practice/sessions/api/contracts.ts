import { z } from 'zod';
import type { JSONContent } from '@tiptap/core';

const optionalTiptapDoc = z
  .union([z.object({ type: z.string(), content: z.array(z.any()) }).passthrough(), z.null(), z.undefined()])
  .transform((val) => val ?? null);

export const CreateSessionSchema = z.object({
  topicIds: z.array(z.uuid()),
  contentFilter: z.enum(['all', 'theory', 'exercises']),
});

export const SessionParamsSchema = z.object({
  id: z.uuid(),
});

export const SessionItemParamsSchema = z.object({
  id: z.uuid(),
  itemId: z.uuid(),
});

export const AnswerTheoryItemSchema = z.object({
  result: z.enum(['incorrect', 'partial', 'correct']),
  response: optionalTiptapDoc,
  notes: optionalTiptapDoc,
});

export const AnswerExerciseItemSchema = z.object({
  selectedChoiceIds: z.array(z.uuid()).min(1),
});

export type SessionTopic = {
  id: string;
  name: string;
  slug: string;
  iconKey: string | null;
};

export type SessionProgress = {
  answered: number;
  skipped: number;
  total: number;
};

export type AttemptResult = 'incorrect' | 'partial' | 'correct';

export type SessionHistoryResult = {
  incorrect: number;
  partial: number;
  correct: number;
  skipped: number;
};

export type ContentFilter = 'all' | 'theory' | 'exercises';

export type TheorySessionItemContent = {
  id: string;
  question: string;
  topics: SessionTopic[];
  sourceName: string | null;
  sourceUrl: string | null;
};

export type ExerciseSessionItemContent = {
  id: string;
  title: string;
  prompt: JSONContent;
  allowMultiple: boolean;
  choices: Array<{ id: string; content: JSONContent; position: number }>;
  topics: SessionTopic[];
  sourceName: string | null;
  sourceUrl: string | null;
};

export type TheorySessionItem = {
  id: string;
  position: number;
  contentType: 'theory';
  content: TheorySessionItemContent;
};

export type ExerciseSessionItem = {
  id: string;
  position: number;
  contentType: 'exercise';
  content: ExerciseSessionItemContent;
};

export type SessionItem = TheorySessionItem | ExerciseSessionItem;

export type GetSessionSetupResponse = {
  topics: SessionTopic[];
};

export type CreateSessionInput = z.infer<typeof CreateSessionSchema>;
export type CreateSessionResponse = {
  id: string;
};

export type GetSessionResponse = {
  id: string;
  status: 'active' | 'completed';
  topicIds: string[];
  contentFilter: ContentFilter;
  progress: SessionProgress;
  currentItem: SessionItem | null;
  unavailableItemId: string | null;
};

export type SessionItemReviewResponse = {
  answer: JSONContent;
  attempts: { incorrect: number; partial: number; correct: number };
  attemptHistory: Array<{
    id: string;
    response: JSONContent | null;
    result: AttemptResult;
    notes: JSONContent | null;
    createdAt: string;
  }>;
};

export type AnswerTheoryItemInput = {
  result: 'incorrect' | 'partial' | 'correct';
  response: JSONContent | null;
  notes: JSONContent | null;
};

export type AnswerTheoryItemResponse = {
  attemptId: string;
  sessionComplete: boolean;
};

export type AnswerExerciseItemInput = {
  selectedChoiceIds: string[];
};

export type AnswerExerciseItemResponse = {
  attemptId: string;
  result: AttemptResult;
  correctChoiceIds: string[];
  explanation: JSONContent | null;
  sessionComplete: boolean;
};

export type SkipItemResponse = {
  sessionComplete: boolean;
};

export type ActiveSessionItem = {
  id: string;
  topicIds: string[];
  topicNames: string[];
  contentFilter: ContentFilter;
  progress: SessionProgress;
  createdAt: string;
};

export type ListActiveSessionsResponse = {
  sessions: ActiveSessionItem[];
};

export type CompletedSessionItem = {
  id: string;
  topicIds: string[];
  topicNames: string[];
  contentFilter: ContentFilter;
  result: SessionHistoryResult;
  total: number;
  completedAt: string;
  createdAt: string;
};

export type ListCompletedSessionsResponse = {
  sessions: CompletedSessionItem[];
};

export type SessionHistoryItemEntry = {
  id: string;
  position: number;
  contentType: 'theory' | 'exercise';
  contentId: string;
  label: string;
  topics: SessionTopic[];
  status: 'answered' | 'skipped';
  result: AttemptResult | null;
};

export type SessionHistoryDetailResponse = {
  id: string;
  topicIds: string[];
  topicNames: string[];
  contentFilter: ContentFilter;
  result: SessionHistoryResult;
  total: number;
  completedAt: string;
  createdAt: string;
  items: SessionHistoryItemEntry[];
};
