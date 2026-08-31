'use client';

import { useCallback, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from '@/i18n/navigation';
import { useReleaseUnsavedGuard } from '@/common/unsaved-changes/use-unsaved-changes-guard';
import { useSnapshotForm } from '@/common/form/use-snapshot-form';
import { mapZodFieldErrorsFlat } from '@/common/lib/map-zod-field-errors';
import { invalidateAdminQuestionCaches } from '@/features/admin/api/invalidate-admin-caches';
import { createSystemQuestion, deleteSystemQuestion, updateSystemQuestion } from '@/features/admin/questions/api/mutations';
import { systemQuestionQueryOptions } from '@/features/admin/questions/api/queries';
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

export type BuilderVariant = 'user' | 'admin';

export type BuilderToastMessages = {
  createSuccess: string;
  updateSuccess: string;
  deleteSuccess: string;
};

function toQuestionInput(snapshot: QuestionFormSnapshot) {
  return {
    question: snapshot.question,
    answer: snapshot.answer,
    topicIds: snapshot.topicIds,
    sourceName: snapshot.sourceName,
    sourceUrl: snapshot.sourceUrl,
    isPublic: snapshot.isPublic,
  };
}

type UseQuestionBuilderFormOptions = {
  questionId?: string;
  variant: BuilderVariant;
  toastMessages: BuilderToastMessages;
};

export type QuestionBuilderSubmitResult = { ok: true } | { ok: false; fieldErrors: Partial<Record<keyof QuestionFormValues, string>> };

export const questionBuilderFieldOrder = ['question', 'answer', 'topicIds', 'sourceName', 'sourceUrl'] as const;

export function useQuestionBuilderForm({ questionId, variant, toastMessages }: UseQuestionBuilderFormOptions) {
  const router = useRouter();
  const releaseGuard = useReleaseUnsavedGuard();
  const queryClient = useQueryClient();
  const isEdit = !!questionId;
  const isAdmin = variant === 'admin';

  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof QuestionFormValues, string>>>({});

  const metadataQuery = useQuery(builderMetadataQueryOptions);
  const userQuestionQuery = useQuery({
    ...questionDetailQueryOptions(questionId ?? ''),
    enabled: isEdit && !isAdmin,
  });
  const adminQuestionQuery = useQuery({
    ...systemQuestionQueryOptions(questionId ?? ''),
    enabled: isEdit && isAdmin,
  });
  const questionQuery = isAdmin ? adminQuestionQuery : userQuestionQuery;

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
      useToastStore.getState().addToast(isEdit ? toastMessages.updateSuccess : toastMessages.createSuccess, 'success');

      if (isAdmin) {
        router.push(`/admin/questions/${id}`);
        void invalidateAdminQuestionCaches(queryClient, id);
        return;
      }

      router.replace(`/theory/${id}`);
      void invalidateQuestionCaches(queryClient, id);
    },
    [form, isAdmin, isEdit, queryClient, releaseGuard, router, toastMessages],
  );

  const onDeleteSuccess = useCallback(() => {
    if (!questionId) return;

    releaseGuard();
    useToastStore.getState().addToast(toastMessages.deleteSuccess, 'success');

    if (isAdmin) {
      router.push('/admin/questions');
      void invalidateAdminQuestionCaches(queryClient, questionId);
      return;
    }

    removeQuestionCaches(queryClient, questionId);
    router.replace('/');
    void invalidateRepositoryCache(queryClient);
  }, [isAdmin, queryClient, questionId, releaseGuard, router, toastMessages]);

  const { mutate: mutateCreate, isPending: isCreating } = useMutation({
    mutationFn: (payload: Parameters<typeof createQuestion>[0]) => (isAdmin ? createSystemQuestion(payload) : createQuestion(payload)),
    onSuccess: (response) => onSaveSuccess(response.id),
  });

  const { mutate: mutateUpdate, isPending: isUpdating } = useMutation({
    mutationFn: (payload: Parameters<typeof updateQuestion>[1]) =>
      isAdmin ? updateSystemQuestion(questionId!, payload) : updateQuestion(questionId!, payload),
    onSuccess: (response) => onSaveSuccess(response.id),
  });

  const { mutate: mutateDelete, isPending: isDeleting } = useMutation({
    mutationFn: () => (isAdmin ? deleteSystemQuestion(questionId!) : deleteQuestion(questionId!)),
    onSuccess: onDeleteSuccess,
  });

  const isSubmitting = isCreating || isUpdating;

  const submit = useCallback((): QuestionBuilderSubmitResult => {
    const snapshot = form.getSnapshot();
    const parsed = QuestionInputSchema.safeParse(toQuestionInput(snapshot));

    if (!parsed.success) {
      const errors = mapZodFieldErrorsFlat(parsed.error) as Partial<Record<keyof QuestionFormValues, string>>;
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
        const topicIds = current.topicIds.includes(topicId) ? current.topicIds.filter((id) => id !== topicId) : [...current.topicIds, topicId];

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
