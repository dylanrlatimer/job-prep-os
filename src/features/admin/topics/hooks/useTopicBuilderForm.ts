'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { useReleaseUnsavedGuard } from '@/common/unsaved-changes/use-unsaved-changes-guard';
import { useSnapshotForm } from '@/common/form/use-snapshot-form';
import { invalidateAdminTopicCaches } from '@/features/admin/api/invalidate-admin-caches';
import { TopicInputSchema, UpdateTopicSchema, type TopicInput, type UpdateTopicInput } from '@/features/admin/topics/api/contracts';
import { createTopic, deleteTopic, updateTopic } from '@/features/admin/topics/api/mutations';
import { topicQueryOptions } from '@/features/admin/topics/api/queries';
import { useToastStore } from '@/lib/store/use-toast-store';

export type TopicFormValues = {
  name: string;
  isActive: boolean;
};

const emptyValues: TopicFormValues = {
  name: '',
  isActive: true,
};

function toCreateInput(values: TopicFormValues): TopicInput {
  return { name: values.name };
}

function toUpdateInput(values: TopicFormValues): UpdateTopicInput {
  return { name: values.name, isActive: values.isActive };
}

function areTopicFormValuesEqual(left: TopicFormValues, right: TopicFormValues) {
  return left.name === right.name && left.isActive === right.isActive;
}

function mapZodFieldErrors(error: { issues: Array<{ path: PropertyKey[]; message: string }> }) {
  const fieldErrors: Partial<Record<keyof TopicFormValues, string>> = {};

  for (const issue of error.issues) {
    const field = issue.path[0];
    if (typeof field === 'string' && !(field in fieldErrors)) {
      fieldErrors[field as keyof TopicFormValues] = issue.message;
    }
  }

  return fieldErrors;
}

type UseTopicBuilderFormOptions = {
  topicId?: string;
};

export type TopicBuilderSubmitResult = { ok: true } | { ok: false; fieldErrors: Partial<Record<keyof TopicFormValues, string>> };

export const topicBuilderFieldOrder = ['name'] as const;

export function useTopicBuilderForm({ topicId }: UseTopicBuilderFormOptions) {
  const t = useTranslations('AdminTopicBuilderPage');
  const router = useRouter();
  const releaseGuard = useReleaseUnsavedGuard();
  const queryClient = useQueryClient();
  const isEdit = !!topicId;

  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof TopicFormValues, string>>>({});
  const [slug, setSlug] = useState('');
  const [questionCount, setQuestionCount] = useState(0);
  const [exerciseCount, setExerciseCount] = useState(0);

  const topicQuery = useQuery({
    ...topicQueryOptions(topicId ?? ''),
    enabled: isEdit,
  });

  const loadedScalars = useMemo((): TopicFormValues | null => {
    if (!topicQuery.data) return null;

    return {
      name: topicQuery.data.name,
      isActive: topicQuery.data.isActive,
    };
  }, [topicQuery.data]);

  const isDataLoading = isEdit && topicQuery.isPending;
  const isDataError = isEdit && topicQuery.isError;

  const form = useSnapshotForm<TopicFormValues, TopicFormValues>({
    isEdit,
    emptyScalars: emptyValues,
    loadedScalars,
    isDataLoading,
    isDataError,
    hasDocumentField: false,
    toSnapshot: (scalars) => scalars,
    snapshotsEqual: areTopicFormValuesEqual,
  });

  useEffect(() => {
    if (!topicQuery.data) return;
    setSlug(topicQuery.data.slug);
    setQuestionCount(topicQuery.data.questionCount);
    setExerciseCount(topicQuery.data.exerciseCount);
  }, [topicQuery.data]);

  const onSaveSuccess = useCallback(
    (id: string) => {
      form.commitSnapshot();
      releaseGuard();
      useToastStore.getState().addToast(isEdit ? t('updateSuccess') : t('createSuccess'), 'success');
      router.push('/admin/topics');
      void invalidateAdminTopicCaches(queryClient, id);
    },
    [form, isEdit, queryClient, releaseGuard, router, t],
  );

  const { mutate: mutateCreate, isPending: isCreating } = useMutation({
    mutationFn: createTopic,
    onSuccess: (response) => onSaveSuccess(response.id),
  });

  const { mutate: mutateUpdate, isPending: isUpdating } = useMutation({
    mutationFn: (payload: UpdateTopicInput) => updateTopic(topicId!, payload),
    onSuccess: (response) => onSaveSuccess(response.id),
  });

  const { mutate: mutateDelete, isPending: isDeleting } = useMutation({
    mutationFn: () => deleteTopic(topicId!),
    onSuccess: () => {
      releaseGuard();
      useToastStore.getState().addToast(t('deleteSuccess'), 'success');
      router.push('/admin/topics');
      void invalidateAdminTopicCaches(queryClient, topicId);
    },
  });

  const isSubmitting = isCreating || isUpdating;

  const submit = useCallback((): TopicBuilderSubmitResult => {
    const snapshot = form.getSnapshot();
    const parsed = isEdit ? UpdateTopicSchema.safeParse(toUpdateInput(snapshot)) : TopicInputSchema.safeParse(toCreateInput(snapshot));

    if (!parsed.success) {
      const errors = mapZodFieldErrors(parsed.error);
      setFieldErrors(errors);
      return { ok: false, fieldErrors: errors };
    }

    setFieldErrors({});
    form.markSubmitting();

    if (isEdit) {
      mutateUpdate(parsed.data as UpdateTopicInput);
      return { ok: true };
    }

    mutateCreate(parsed.data as TopicInput);
    return { ok: true };
  }, [form, isEdit, mutateCreate, mutateUpdate]);

  const setField = useCallback(
    <K extends keyof TopicFormValues>(field: K, value: TopicFormValues[K]) => {
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
      slug,
      questionCount,
      exerciseCount,
      isLoading: isDataLoading,
      isError: isDataError,
      isSubmitting,
      isDeleting,
      submit,
      setField,
      remove,
      refetch: () => {
        if (isEdit) void topicQuery.refetch();
      },
    }),
    [
      exerciseCount,
      fieldErrors,
      form,
      isDataError,
      isDataLoading,
      isDeleting,
      isEdit,
      isSubmitting,
      questionCount,
      remove,
      setField,
      slug,
      submit,
      topicQuery,
    ],
  );
}
