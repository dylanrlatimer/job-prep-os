import { z } from 'zod';

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

export const QuestionInputSchema = z.object({
  question: z.string().trim().min(1, { error: 'questionRequired' }),
  answer: z.string().trim().min(1, { error: 'answerRequired' }),
  categoryIds: z.array(z.uuid()).min(1, { error: 'categoriesRequired' }),
  sourceName: optionalTrimmedText(200),
  sourceUrl: optionalUrl(),
  isPublic: z.boolean(),
});

export type QuestionInput = z.infer<typeof QuestionInputSchema>;

export const CreateQuestionSchema = QuestionInputSchema;
export type CreateQuestionInput = z.infer<typeof CreateQuestionSchema>;

export const UpdateQuestionSchema = QuestionInputSchema;
export type UpdateQuestionInput = z.infer<typeof UpdateQuestionSchema>;

export const GetQuestionParamsSchema = z.object({
  id: z.uuid(),
});

export type BuilderCategory = {
  id: string;
  name: string;
  slug: string;
};

export type BuilderMetadataResponse = {
  categories: BuilderCategory[];
};

export type QuestionResponse = {
  id: string;
  question: string;
  answer: string;
  categoryIds: string[];
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
