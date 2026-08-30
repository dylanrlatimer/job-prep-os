import { z } from 'zod';
import type { JSONContent } from '@tiptap/core';

function optionalTrimmedText(maxLength: number) {
  return z
    .union([z.string(), z.null(), z.undefined()])
    .transform((value) => {
      const trimmed = (value ?? '').trim();
      return trimmed.length > 0 ? trimmed : null;
    })
    .pipe(z.union([z.string().max(maxLength), z.null()]));
}

function optionalUrl() {
  return z
    .union([z.string(), z.null(), z.undefined()])
    .transform((value) => {
      const trimmed = (value ?? '').trim();
      return trimmed.length > 0 ? trimmed : null;
    })
    .pipe(z.union([z.url({ error: 'invalidSourceUrl' }), z.null()]));
}

function hasTextContent(nodes: unknown[]): boolean {
  return nodes.some((n) => {
    if (!n || typeof n !== 'object') return false;
    const node = n as Record<string, unknown>;
    if (node.type === 'text' && typeof node.text === 'string' && node.text.trim().length > 0) return true;
    if (Array.isArray(node.content)) return hasTextContent(node.content as unknown[]);
    return false;
  });
}

const tiptapDocSchema = z
  .object({
    type: z.literal('doc'),
    content: z.array(z.record(z.string(), z.unknown())),
  })
  .passthrough()
  .refine((doc) => Array.isArray(doc.content) && hasTextContent(doc.content), 'answerRequired');

export const QuestionInputSchema = z.object({
  question: z.string().trim().min(1, { error: 'questionRequired' }),
  answer: tiptapDocSchema,
  topicIds: z.array(z.uuid()),
  sourceName: optionalTrimmedText(200),
  sourceUrl: optionalUrl(),
  isPublic: z.boolean(),
});

export type QuestionInput = Omit<z.infer<typeof QuestionInputSchema>, 'answer'> & { answer: JSONContent };

export const CreateQuestionSchema = QuestionInputSchema;
export type CreateQuestionInput = z.infer<typeof CreateQuestionSchema>;

export const UpdateQuestionSchema = QuestionInputSchema;
export type UpdateQuestionInput = z.infer<typeof UpdateQuestionSchema>;

export const GetQuestionParamsSchema = z.object({
  id: z.uuid(),
});

export type BuilderTopic = {
  id: string;
  name: string;
  slug: string;
  iconKey: string | null;
};

export type BuilderMetadataResponse = {
  topics: BuilderTopic[];
};

export type QuestionResponse = {
  id: string;
  question: string;
  answer: JSONContent;
  topicIds: string[];
  sourceName: string | null;
  sourceUrl: string | null;
  isPublic: boolean;
};

export type CreateQuestionResponse = {
  id: string;
};

export type UpdateQuestionResponse = {
  id: string;
};

export type DeleteQuestionResponse = {
  id: string;
};
