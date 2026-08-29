'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { useAllowUnsavedNavigation } from '@/common/unsaved-changes/use-unsaved-changes-guard';
import { invalidateAdminQuestionCaches } from '@/features/admin/api/invalidate-admin-caches';
import { createSystemQuestion, deleteSystemQuestion, updateSystemQuestion } from '@/features/admin/questions/api/mutations';
import { systemQuestionQueryOptions } from '@/features/admin/questions/api/queries';
import { SystemQuestionInputSchema, type SystemQuestionInput } from '@/features/admin/questions/api/contracts';
import { builderMetadataQueryOptions } from '@/features/theory/builder/api/queries';
import { areQuestionFormValuesEqual, emptyQuestionFormValues, type QuestionFormValues } from '@/features/theory/builder/lib/question-form-values';
import { useToastStore } from '@/lib/store/use-toast-store';

const emptyValues: QuestionFormValues = {
  ...emptyQuestionFormValues,
  isPublic: false,
};

function toSystemQuestionInput(values: QuestionFormValues): SystemQuestionInput {
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

type UseSystemQuestionBuilderFormOptions = {
  questionId?: string;
};

export type SystemQuestionBuilderSubmitResult = { ok: true } | { ok: false; fieldErrors: Partial<Record<keyof QuestionFormValues, string>> };

export const systemQuestionBuilderFieldOrder = ['question', 'answer', 'categoryIds', 'sourceName', 'sourceUrl'] as const;

export function useSystemQuestionBuilderForm({ questionId }: UseSystemQuestionBuilderFormOptions) {
  const t = useTranslations('AdminSystemQuestionBuilderPage');
  const router = useRouter();
  const allowNavigation = useAllowUnsavedNavigation();
  const queryClient = useQueryClient();
  const isEdit = !!questionId;

  const [values, setValues] = useState<QuestionFormValues>(emptyValues);
  const [baseline, setBaseline] = useState<QuestionFormValues | null>(isEdit ? null : emptyValues);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof QuestionFormValues, string>>>({});

  const metadataQuery = useQuery(builderMetadataQueryOptions);
  const questionQuery = useQuery({
    ...systemQuestionQueryOptions(questionId ?? ''),
    enabled: isEdit,
  });

  useEffect(() => {
    if (!questionQuery.data) return;

    const loaded = {
      question: questionQuery.data.question,
      answer: questionQuery.data.answer,
      categoryIds: questionQuery.data.categoryIds,
      sourceName: questionQuery.data.sourceName ?? '',
      sourceUrl: questionQuery.data.sourceUrl ?? '',
      isPublic: questionQuery.data.isPublic,
    };

    setValues(loaded);
    setBaseline(loaded);
  }, [questionQuery.data]);

  const isDirty = baseline !== null && !areQuestionFormValuesEqual(values, baseline);

  const onSuccess = useCallback(
    async (id: string) => {
      await invalidateAdminQuestionCaches(queryClient, id);
      useToastStore.getState().addToast(isEdit ? t('updateSuccess') : t('createSuccess'), 'success');
      allowNavigation(() => router.push('/admin/questions'));
    },
    [allowNavigation, isEdit, queryClient, router, t],
  );

  const { mutate: mutateCreate, isPending: isCreating } = useMutation({
    mutationFn: createSystemQuestion,
    onSuccess: (response) => onSuccess(response.id),
  });

  const { mutate: mutateUpdate, isPending: isUpdating } = useMutation({
    mutationFn: (payload: SystemQuestionInput) => updateSystemQuestion(questionId!, payload),
    onSuccess: (response) => onSuccess(response.id),
  });

  const { mutate: mutateDelete, isPending: isDeleting } = useMutation({
    mutationFn: () => deleteSystemQuestion(questionId!),
    onSuccess: async () => {
      await invalidateAdminQuestionCaches(queryClient, questionId);
      useToastStore.getState().addToast(t('deleteSuccess'), 'success');
      allowNavigation(() => router.push('/admin/questions'));
    },
  });

  const isSubmitting = isCreating || isUpdating;

  const submit = useCallback((): SystemQuestionBuilderSubmitResult => {
    const parsed = SystemQuestionInputSchema.safeParse(toSystemQuestionInput(values));

    if (!parsed.success) {
      const errors = mapZodFieldErrors(parsed.error);
      setFieldErrors(errors);
      return { ok: false, fieldErrors: errors };
    }

    setFieldErrors({});

    if (isEdit) {
      mutateUpdate(parsed.data);
      return { ok: true };
    }

    mutateCreate(parsed.data);
    return { ok: true };
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

  const remove = useCallback(() => {
    if (!isEdit || isDeleting) return;
    mutateDelete();
  }, [isDeleting, isEdit, mutateDelete]);

  const isLoading = metadataQuery.isPending || (isEdit && questionQuery.isPending);
  const isError = metadataQuery.isError || (isEdit && questionQuery.isError);

  return useMemo(
    () => ({
      isEdit,
      values,
      fieldErrors,
      isDirty,
      metadata: metadataQuery.data,
      isLoading,
      isError,
      isSubmitting,
      isDeleting,
      submit,
      setField,
      toggleCategory,
      remove,
      refetch: () => {
        void metadataQuery.refetch();
        if (isEdit) void questionQuery.refetch();
      },
    }),
    [fieldErrors, isDeleting, isDirty, isEdit, isError, isLoading, isSubmitting, metadataQuery, questionQuery, remove, setField, submit, toggleCategory, values],
  );
}
