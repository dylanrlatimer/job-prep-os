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

function requiredTiptapDocSchema(message: string) {
  return z
    .object({
      type: z.literal('doc'),
      content: z.array(z.record(z.string(), z.unknown())),
    })
    .passthrough()
    .refine((doc) => Array.isArray(doc.content) && hasTextContent(doc.content), message);
}

const optionalTiptapDocSchema = z
  .union([
    z
      .object({
        type: z.literal('doc'),
        content: z.array(z.record(z.string(), z.unknown())),
      })
      .passthrough(),
    z.null(),
    z.undefined(),
  ])
  .transform((doc) => {
    if (doc == null) return null;
    if (Array.isArray(doc.content) && hasTextContent(doc.content)) {
      return doc;
    }
    return null;
  });

const ExerciseChoiceInputSchema = z.object({
  content: requiredTiptapDocSchema('choiceContentRequired'),
  isCorrect: z.boolean(),
});

export const ExerciseInputSchema = z
  .object({
    title: z.string().trim().min(1, { error: 'titleRequired' }).max(200),
    prompt: requiredTiptapDocSchema('questionRequired'),
    explanation: optionalTiptapDocSchema,
    topicIds: z.array(z.uuid()),
    sourceName: optionalTrimmedText(200),
    sourceUrl: optionalUrl(),
    isPublic: z.boolean(),
    allowMultiple: z.boolean(),
    choices: z.array(ExerciseChoiceInputSchema).min(2, { error: 'choicesMin' }).max(8, { error: 'choicesMax' }),
  })
  .refine((input) => input.choices.some((choice) => choice.isCorrect), {
    path: ['choices'],
    error: 'correctChoiceRequired',
  });

export type ExerciseChoiceInput = Omit<z.infer<typeof ExerciseChoiceInputSchema>, 'content'> & { content: JSONContent };

export type ExerciseInput = Omit<z.infer<typeof ExerciseInputSchema>, 'prompt' | 'explanation' | 'choices'> & {
  prompt: JSONContent;
  explanation: JSONContent | null;
  choices: ExerciseChoiceInput[];
};

export const CreateExerciseSchema = ExerciseInputSchema;
export type CreateExerciseInput = z.infer<typeof CreateExerciseSchema>;

export const UpdateExerciseSchema = ExerciseInputSchema;
export type UpdateExerciseInput = z.infer<typeof UpdateExerciseSchema>;

export const GetExerciseParamsSchema = z.object({
  id: z.uuid(),
});

export type BuilderTopic = {
  id: string;
  name: string;
  slug: string;
};

export type BuilderMetadataResponse = {
  topics: BuilderTopic[];
};

export type ExerciseChoiceResponse = {
  content: JSONContent;
  isCorrect: boolean;
};

export type ExerciseResponse = {
  id: string;
  title: string;
  prompt: JSONContent;
  explanation: JSONContent | null;
  topicIds: string[];
  sourceName: string | null;
  sourceUrl: string | null;
  isPublic: boolean;
  allowMultiple: boolean;
  choices: ExerciseChoiceResponse[];
};

export type CreateExerciseResponse = {
  id: string;
};

export type UpdateExerciseResponse = {
  id: string;
};

export type DeleteExerciseResponse = {
  id: string;
};
