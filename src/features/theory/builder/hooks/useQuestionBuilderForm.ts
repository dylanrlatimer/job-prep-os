'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { QuestionInputSchema, type QuestionInput } from '@/features/theory/builder/api/contracts';
import { createQuestion, updateQuestion } from '@/features/theory/builder/api/mutations';
import { builderMetadataQueryOptions, questionDetailQueryOptions } from '@/features/theory/builder/api/queries';
import { theoryKeys } from '@/features/theory/api/query-keys';
import { useToastStore } from '@/lib/store/use-toast-store';

export type QuestionFormValues = {
  question: string;
  answer: string;
  categoryIds: string[];
  sourceName: string;
  sourceUrl: string;
  isPublic: boolean;
};

const emptyValues: QuestionFormValues = {
  question: '',
  answer: '',
  categoryIds: [],
  sourceName: '',
  sourceUrl: '',
  isPublic: false,
};

function toQuestionInput(values: QuestionFormValues): QuestionInput {
  return {
    question: values.question,
    answer: values.answer,
    categoryIds: values.categoryIds,
    sourceName: values.sourceName,
    sourceUrl: values.sourceUrl,
    isPublic: values.isPublic,
  };
}

function mapZodFieldErrors(error: { issues: Array<{ path: PropertyKey[]; message: string }> }) {
  const fieldErrors: Partial<Record<keyof QuestionFormValues, string>> = {};

  for (const issue of error.issues) {
    const field = issue.path[0];
    if (typeof field === 'string' && !(field in fieldErrors)) {
      fieldErrors[field as keyof QuestionFormValues] = issue.message;
    }
  }

  return fieldErrors;
}

type UseQuestionBuilderFormOptions = {
  questionId?: string;
};

export function useQuestionBuilderForm({ questionId }: UseQuestionBuilderFormOptions) {
  const t = useTranslations('QuestionBuilderPage');
  const router = useRouter();
  const queryClient = useQueryClient();
  const isEdit = !!questionId;

  const [values, setValues] = useState<QuestionFormValues>(emptyValues);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof QuestionFormValues, string>>>({});

  const metadataQuery = useQuery(builderMetadataQueryOptions);
  const questionQuery = useQuery({
    ...questionDetailQueryOptions(questionId ?? ''),
    enabled: isEdit,
  });

  useEffect(() => {
    if (!questionQuery.data) return;

    setValues({
      question: questionQuery.data.question,
      answer: questionQuery.data.answer,
      categoryIds: questionQuery.data.categoryIds,
      sourceName: questionQuery.data.sourceName ?? '',
      sourceUrl: questionQuery.data.sourceUrl ?? '',
      isPublic: questionQuery.data.isPublic,
    });
  }, [questionQuery.data]);

  const onSuccess = useCallback(
    async (id: string) => {
      await queryClient.invalidateQueries({ queryKey: theoryKeys.repository() });
      await queryClient.invalidateQueries({ queryKey: theoryKeys.question(id) });
      useToastStore.getState().addToast(isEdit ? t('updateSuccess') : t('createSuccess'), 'success');
      router.push('/');
    },
    [isEdit, queryClient, router, t],
  );

  const { mutate: mutateCreate, isPending: isCreating } = useMutation({
    mutationFn: createQuestion,
    onSuccess: (response) => onSuccess(response.id),
  });

  const { mutate: mutateUpdate, isPending: isUpdating } = useMutation({
    mutationFn: (payload: QuestionInput) => updateQuestion(questionId!, payload),
    onSuccess: (response) => onSuccess(response.id),
  });

  const isSubmitting = isCreating || isUpdating;

  const submit = useCallback(() => {
    const parsed = QuestionInputSchema.safeParse(toQuestionInput(values));

    if (!parsed.success) {
      setFieldErrors(mapZodFieldErrors(parsed.error));
      return;
    }

    setFieldErrors({});

    if (isEdit) {
      mutateUpdate(parsed.data);
      return;
    }

    mutateCreate(parsed.data);
  }, [isEdit, mutateCreate, mutateUpdate, values]);

  const setField = useCallback(<K extends keyof QuestionFormValues>(field: K, value: QuestionFormValues[K]) => {
    setValues((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  }, []);

  const toggleCategory = useCallback((categoryId: string) => {
    setValues((current) => {
      const categoryIds = current.categoryIds.includes(categoryId)
        ? current.categoryIds.filter((id) => id !== categoryId)
        : [...current.categoryIds, categoryId];

      return { ...current, categoryIds };
    });

    setFieldErrors((current) => {
      if (!current.categoryIds) return current;
      const next = { ...current };
      delete next.categoryIds;
      return next;
    });
  }, []);

  const isLoading = metadataQuery.isPending || (isEdit && questionQuery.isPending);
  const isError = metadataQuery.isError || (isEdit && questionQuery.isError);

  return useMemo(
    () => ({
      isEdit,
      values,
      fieldErrors,
      metadata: metadataQuery.data,
      isLoading,
      isError,
      isSubmitting,
      submit,
      setField,
      toggleCategory,
      refetch: () => {
        void metadataQuery.refetch();
        if (isEdit) void questionQuery.refetch();
      },
    }),
    [fieldErrors, isEdit, isError, isLoading, isSubmitting, metadataQuery, questionQuery, setField, submit, toggleCategory, values],
  );
}
