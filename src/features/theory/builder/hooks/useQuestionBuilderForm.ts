'use client';

import { useCallback, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { useReleaseUnsavedGuard } from '@/common/unsaved-changes/use-unsaved-changes-guard';
import { useSnapshotForm } from '@/common/form/use-snapshot-form';
import { QuestionInputSchema } from '@/features/theory/builder/api/contracts';
import { createQuestion, deleteQuestion, updateQuestion } from '@/features/theory/builder/api/mutations';
import { builderMetadataQueryOptions, questionDetailQueryOptions } from '@/features/theory/builder/api/queries';
import {
  areQuestionSnapshotsEqual,
  emptyQuestionScalars,
  toQuestionSnapshot,
  type QuestionFormSnapshot,
  type QuestionFormValues,
  type QuestionScalars,
} from '@/features/theory/builder/lib/question-form-values';
import { invalidateQuestionCaches, invalidateRepositoryCache, removeQuestionCaches } from '@/features/theory/api/invalidate-question-caches';
import { useToastStore } from '@/lib/store/use-toast-store';

export type { QuestionFormValues } from '@/features/theory/builder/lib/question-form-values';

function toQuestionInput(snapshot: QuestionFormSnapshot) {
  return {
    question: snapshot.question,
    answer: snapshot.answer,
    categoryIds: snapshot.categoryIds,
    sourceName: snapshot.sourceName,
    sourceUrl: snapshot.sourceUrl,
    isPublic: snapshot.isPublic,
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

export type QuestionBuilderSubmitResult = { ok: true } | { ok: false; fieldErrors: Partial<Record<keyof QuestionFormValues, string>> };

export const questionBuilderFieldOrder = ['question', 'answer', 'categoryIds', 'sourceName', 'sourceUrl'] as const;

export function useQuestionBuilderForm({ questionId }: UseQuestionBuilderFormOptions) {
  const t = useTranslations('QuestionBuilderPage');
  const router = useRouter();
  const releaseGuard = useReleaseUnsavedGuard();
  const queryClient = useQueryClient();
  const isEdit = !!questionId;

  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof QuestionFormValues, string>>>({});

  const metadataQuery = useQuery(builderMetadataQueryOptions);
  const questionQuery = useQuery({
    ...questionDetailQueryOptions(questionId ?? ''),
    enabled: isEdit,
  });

  const loadedScalars = useMemo((): QuestionScalars | null => {
    if (!questionQuery.data) return null;

    return {
      question: questionQuery.data.question,
      categoryIds: questionQuery.data.categoryIds,
      sourceName: questionQuery.data.sourceName ?? '',
      sourceUrl: questionQuery.data.sourceUrl ?? '',
      isPublic: questionQuery.data.isPublic,
    };
  }, [questionQuery.data]);

  const initialDocument = questionQuery.data?.answer ?? null;

  const isDataLoading = metadataQuery.isPending || (isEdit && questionQuery.isPending);
  const isDataError = metadataQuery.isError || (isEdit && questionQuery.isError);

  const form = useSnapshotForm<QuestionFormSnapshot, QuestionScalars>({
    isEdit,
    emptyScalars: emptyQuestionScalars,
    loadedScalars,
    isDataLoading,
    isDataError,
    hasDocumentField: true,
    toSnapshot: toQuestionSnapshot,
    snapshotsEqual: areQuestionSnapshotsEqual,
  });

  const onSaveSuccess = useCallback(
    (id: string) => {
      form.commitSnapshot();
      releaseGuard();
      useToastStore.getState().addToast(isEdit ? t('updateSuccess') : t('createSuccess'), 'success');
      router.replace(`/theory/${id}`);
      void invalidateQuestionCaches(queryClient, id);
    },
    [form, isEdit, queryClient, releaseGuard, router, t],
  );

  const onDeleteSuccess = useCallback(() => {
    if (!questionId) return;

    removeQuestionCaches(queryClient, questionId);
    releaseGuard();
    useToastStore.getState().addToast(t('deleteSuccess'), 'success');
    router.replace('/');
    void invalidateRepositoryCache(queryClient);
  }, [questionId, queryClient, releaseGuard, router, t]);

  const { mutate: mutateCreate, isPending: isCreating } = useMutation({
    mutationFn: createQuestion,
    onSuccess: (response) => onSaveSuccess(response.id),
  });

  const { mutate: mutateUpdate, isPending: isUpdating } = useMutation({
    mutationFn: (payload: Parameters<typeof updateQuestion>[1]) => updateQuestion(questionId!, payload),
    onSuccess: (response) => onSaveSuccess(response.id),
  });

  const { mutate: mutateDelete, isPending: isDeleting } = useMutation({
    mutationFn: () => deleteQuestion(questionId!),
    onSuccess: onDeleteSuccess,
  });

  const isSubmitting = isCreating || isUpdating;

  const submit = useCallback((): QuestionBuilderSubmitResult => {
    const snapshot = form.getSnapshot();
    const parsed = QuestionInputSchema.safeParse(toQuestionInput(snapshot));

    if (!parsed.success) {
      const errors = mapZodFieldErrors(parsed.error);
      setFieldErrors(errors);
      return { ok: false, fieldErrors: errors };
    }

    setFieldErrors({});
    form.markSubmitting();

    if (isEdit) {
      mutateUpdate(parsed.data);
      return { ok: true };
    }

    mutateCreate(parsed.data);
    return { ok: true };
  }, [form, isEdit, mutateCreate, mutateUpdate]);

  const setField = useCallback(
    <K extends keyof QuestionScalars>(field: K, value: QuestionScalars[K]) => {
      form.setScalar(field, value);
      setFieldErrors((current) => {
        if (!current[field]) return current;
        const next = { ...current };
        delete next[field];
        return next;
      });
    },
    [form],
  );

  const toggleCategory = useCallback(
    (categoryId: string) => {
      form.setScalars((current) => {
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
    },
    [form],
  );

  const remove = useCallback(() => {
    if (!isEdit || isDeleting) return;
    mutateDelete();
  }, [isDeleting, isEdit, mutateDelete]);

  return useMemo(
    () => ({
      isEdit,
      values: form.scalars,
      fieldErrors,
      isDirty: form.isDirty,
      status: form.status,
      initialDocument,
      editorRef: form.editorRef,
      metadata: metadataQuery.data,
      isLoading: isDataLoading,
      isError: isDataError,
      isFormDataReady: form.isFormDataReady,
      isSubmitting,
      isDeleting,
      submit,
      setField,
      toggleCategory,
      onEditorReady: form.onEditorReady,
      onDocumentUpdate: form.onDocumentUpdate,
      remove,
      refetch: () => {
        void metadataQuery.refetch();
        if (isEdit) void questionQuery.refetch();
      },
    }),
    [
      fieldErrors,
      form,
      initialDocument,
      isDataError,
      isDataLoading,
      isDeleting,
      isEdit,
      isSubmitting,
      metadataQuery,
      questionQuery,
      remove,
      setField,
      submit,
      toggleCategory,
    ],
  );
}
