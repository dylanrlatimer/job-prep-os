import { z } from 'zod';
import type { JSONContent } from '@tiptap/core';
import { QuestionInputSchema } from '@/features/theory/builder/api/contracts';
import type { RepositoryTopic } from '@/features/theory/repository/api/contracts';

export const SystemQuestionInputSchema = QuestionInputSchema;
export type SystemQuestionInput = z.infer<typeof SystemQuestionInputSchema>;

export const CreateSystemQuestionSchema = SystemQuestionInputSchema;
export type CreateSystemQuestionInput = z.infer<typeof CreateSystemQuestionSchema>;

export const UpdateSystemQuestionSchema = SystemQuestionInputSchema;
export type UpdateSystemQuestionInput = z.infer<typeof UpdateSystemQuestionSchema>;

export const GetSystemQuestionParamsSchema = z.object({
  id: z.uuid(),
});

export type SystemQuestionListItem = {
  id: string;
  question: string;
  isPublic: boolean;
  topics: RepositoryTopic[];
  updatedAt: string;
};

export type ListSystemQuestionsResponse = {
  questions: SystemQuestionListItem[];
  topics: RepositoryTopic[];
};

export type SystemQuestionResponse = {
  id: string;
  question: string;
  answer: JSONContent;
  topicIds: string[];
  sourceName: string | null;
  sourceUrl: string | null;
  isPublic: boolean;
};

export type CreateSystemQuestionResponse = {
  id: string;
};

export type UpdateSystemQuestionResponse = {
  id: string;
};

export type DeleteSystemQuestionResponse = {
  id: string;
};
