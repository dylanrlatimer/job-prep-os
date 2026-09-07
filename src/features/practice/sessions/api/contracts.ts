import { z } from 'zod';
import type { JSONContent } from '@tiptap/core';

const optionalTiptapDoc = z
  .union([z.object({ type: z.string(), content: z.array(z.any()) }).passthrough(), z.null(), z.undefined()])
  .transform((val) => val ?? null);

export const CreateSessionSchema = z.object({
  exerciseRatio: z.number().int().min(0).max(100),
  topics: z
    .array(
      z.object({
        topicId: z.uuid(),
        count: z.number().int().min(1).max(200),
      }),
    )
    .min(1, 'noTopicsSelected')
    .transform((topics) => {
      const seen = new Set<string>();
      return topics.filter((topic) => {
        if (seen.has(topic.topicId)) {
          return false;
        }

        seen.add(topic.topicId);
        return true;
      });
    }),
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

export type SessionSetupTopic = SessionTopic & {
  theoryCount: number;
  exerciseCount: number;
};

export type SessionAllocation = {
  id: string;
  name: string;
  requested: number;
  filled: number;
};

export type SessionFill = {
  topicId: string;
  requested: number;
  filled: number;
  exercises: number;
  theory: number;
};

export type PreviewSessionResponse = {
  total: number;
  exercises: number;
  theory: number;
  topics: SessionFill[];
};

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
  exerciseRatio: number;
  topics: SessionSetupTopic[];
};

export type CreateSessionInput = z.infer<typeof CreateSessionSchema>;
export type CreateSessionResponse = PreviewSessionResponse & {
  id: string;
};

export type GetSessionResponse = {
  id: string;
  status: 'active' | 'completed';
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
  exerciseRatio: number;
  topics: SessionAllocation[];
  progress: SessionProgress;
  createdAt: string;
};

export type ListActiveSessionsResponse = {
  sessions: ActiveSessionItem[];
};

export type CompletedSessionItem = {
  id: string;
  exerciseRatio: number;
  topics: SessionAllocation[];
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
  exerciseRatio: number;
  topics: SessionAllocation[];
  result: SessionHistoryResult;
  total: number;
  completedAt: string;
  createdAt: string;
  items: SessionHistoryItemEntry[];
};
