'use client';

import { useCallback, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { useReleaseUnsavedGuard } from '@/common/unsaved-changes/use-unsaved-changes-guard';
import { useSnapshotForm } from '@/common/form/use-snapshot-form';
import { invalidateAdminQuestionCaches } from '@/features/admin/api/invalidate-admin-caches';
import { createSystemQuestion, deleteSystemQuestion, updateSystemQuestion } from '@/features/admin/questions/api/mutations';
import { systemQuestionQueryOptions } from '@/features/admin/questions/api/queries';
import { SystemQuestionInputSchema } from '@/features/admin/questions/api/contracts';
import { builderMetadataQueryOptions } from '@/features/theory/builder/api/queries';
import {
  areQuestionSnapshotsEqual,
  emptyQuestionScalars,
  toQuestionSnapshot,
  type QuestionFormSnapshot,
  type QuestionFormValues,
  type QuestionScalars,
} from '@/features/theory/builder/lib/question-form-values';
import { useToastStore } from '@/lib/store/use-toast-store';

const emptyScalars: QuestionScalars = {
  ...emptyQuestionScalars,
  isPublic: false,
};

function toSystemQuestionInput(snapshot: QuestionFormSnapshot) {
  return {
    question: snapshot.question,
    answer: snapshot.answer,
    topicIds: snapshot.topicIds,
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

type UseSystemQuestionBuilderFormOptions = {
  questionId?: string;
};

export type SystemQuestionBuilderSubmitResult = { ok: true } | { ok: false; fieldErrors: Partial<Record<keyof QuestionFormValues, string>> };

export const systemQuestionBuilderFieldOrder = ['question', 'answer', 'topicIds', 'sourceName', 'sourceUrl'] as const;

export function useSystemQuestionBuilderForm({ questionId }: UseSystemQuestionBuilderFormOptions) {
  const t = useTranslations('AdminSystemQuestionBuilderPage');
  const router = useRouter();
  const releaseGuard = useReleaseUnsavedGuard();
  const queryClient = useQueryClient();
  const isEdit = !!questionId;

  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof QuestionFormValues, string>>>({});

  const metadataQuery = useQuery(builderMetadataQueryOptions);
  const questionQuery = useQuery({
    ...systemQuestionQueryOptions(questionId ?? ''),
    enabled: isEdit,
  });

  const loadedScalars = useMemo((): QuestionScalars | null => {
    if (!questionQuery.data) return null;

    return {
      question: questionQuery.data.question,
      topicIds: questionQuery.data.topicIds,
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
    emptyScalars,
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
      router.push(`/admin/questions/${id}`);
      void invalidateAdminQuestionCaches(queryClient, id);
    },
    [form, isEdit, queryClient, releaseGuard, router, t],
  );

  const { mutate: mutateCreate, isPending: isCreating } = useMutation({
    mutationFn: createSystemQuestion,
    onSuccess: (response) => onSaveSuccess(response.id),
  });

  const { mutate: mutateUpdate, isPending: isUpdating } = useMutation({
    mutationFn: (payload: Parameters<typeof updateSystemQuestion>[1]) => updateSystemQuestion(questionId!, payload),
    onSuccess: (response) => onSaveSuccess(response.id),
  });

  const { mutate: mutateDelete, isPending: isDeleting } = useMutation({
    mutationFn: () => deleteSystemQuestion(questionId!),
    onSuccess: () => {
      releaseGuard();
      useToastStore.getState().addToast(t('deleteSuccess'), 'success');
      router.push('/admin/questions');
      void invalidateAdminQuestionCaches(queryClient, questionId);
    },
  });

  const isSubmitting = isCreating || isUpdating;

  const submit = useCallback((): SystemQuestionBuilderSubmitResult => {
    const snapshot = form.getSnapshot();
    const parsed = SystemQuestionInputSchema.safeParse(toSystemQuestionInput(snapshot));

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

  const toggleTopic = useCallback(
    (topicId: string) => {
      form.setScalars((current) => {
        const topicIds = current.topicIds.includes(topicId)
          ? current.topicIds.filter((id) => id !== topicId)
          : [...current.topicIds, topicId];

        return { ...current, topicIds };
      });

      setFieldErrors((current) => {
        if (!current.topicIds) return current;
        const next = { ...current };
        delete next.topicIds;
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
      toggleTopic,
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
      toggleTopic,
    ],
  );
}
