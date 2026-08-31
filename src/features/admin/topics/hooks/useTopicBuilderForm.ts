'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { useUnsavedChangesGuard, useReleaseUnsavedGuard } from '@/common/unsaved-changes/use-unsaved-changes-guard';
import { mapZodFieldErrorsFlat } from '@/common/lib/map-zod-field-errors';
import { invalidateAdminTopicCaches } from '@/features/admin/api/invalidate-admin-caches';
import { isTopicIconKey, type TopicIconKey } from '@/common/topics/icon-keys';
import { TopicInputSchema, UpdateTopicSchema, type TopicInput, type UpdateTopicInput } from '@/features/admin/topics/api/contracts';
import { createTopic, deleteTopic, updateTopic } from '@/features/admin/topics/api/mutations';
import { topicQueryOptions } from '@/features/admin/topics/api/queries';
import { useToastStore } from '@/lib/store/use-toast-store';

export type TopicFormValues = {
  name: string;
  iconKey: TopicIconKey | null;
  isActive: boolean;
};

const emptyFields: TopicFormValues = {
  name: '',
  iconKey: null,
  isActive: true,
};

function areTopicValuesEqual(left: TopicFormValues, right: TopicFormValues) {
  return left.name === right.name && left.iconKey === right.iconKey && left.isActive === right.isActive;
}

type UseTopicBuilderFormOptions = {
  topicId?: string;
};

export type TopicBuilderSubmitResult = { ok: true } | { ok: false; fieldErrors: Partial<Record<keyof TopicFormValues, string>> };

export const topicBuilderFieldOrder = ['name', 'iconKey'] as const;

export function useTopicBuilderForm({ topicId }: UseTopicBuilderFormOptions) {
  const t = useTranslations('AdminTopicBuilderPage');
  const router = useRouter();
  const releaseGuard = useReleaseUnsavedGuard();
  const queryClient = useQueryClient();
  const isEdit = !!topicId;

  const [fields, setFields] = useState<TopicFormValues>(emptyFields);
  const [savedFields, setSavedFields] = useState<TopicFormValues | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'submitting'>('loading');
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof TopicFormValues, string>>>({});

  const fieldsRef = useRef(fields);
  fieldsRef.current = fields;

  // --- Data fetching ---
  const topicQuery = useQuery({
    ...topicQueryOptions(topicId ?? ''),
    enabled: isEdit,
  });

  const isDataLoading = isEdit && topicQuery.isPending;
  const isDataError = isEdit && topicQuery.isError;

  const loadedFields = useMemo((): TopicFormValues | null => {
    const data = topicQuery.data;
    if (!data) return null;
    return {
      name: data.name,
      iconKey: isTopicIconKey(data.iconKey) ? data.iconKey : null,
      isActive: data.isActive,
    };
  }, [topicQuery.data]);

  // Seed field state when loaded data arrives (also re-seeds on query refresh).
  // Create mode has no fetch — become ready immediately with empty fields.
  useEffect(() => {
    if (!isEdit) {
      setFields(emptyFields);
      setSavedFields(emptyFields);
      setStatus('ready');
      return;
    }
    if (loadedFields) {
      setFields(loadedFields);
      setSavedFields(loadedFields);
      setStatus('ready');
    }
  }, [isEdit, loadedFields]);

  // --- Dirty detection ---
  const isDirty = status === 'ready' && savedFields !== null && !areTopicValuesEqual(fields, savedFields);

  useUnsavedChangesGuard(status === 'ready' && isDirty && !isDataError);

  // --- Field setters ---
  const setField = useCallback(<K extends keyof TopicFormValues>(field: K, value: TopicFormValues[K]) => {
    setFields((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  }, []);

  // --- Mutations ---
  const onSaveSuccess = (id: string) => {
    setSavedFields(fieldsRef.current);
    setStatus('ready');
    releaseGuard();
    useToastStore.getState().addToast(isEdit ? t('updateSuccess') : t('createSuccess'), 'success');
    router.push('/admin/topics');
    void invalidateAdminTopicCaches(queryClient, id);
  };

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

  // --- Submit ---
  const submit = (): TopicBuilderSubmitResult => {
    const parsed = isEdit
      ? UpdateTopicSchema.safeParse({ name: fields.name, isActive: fields.isActive, iconKey: fields.iconKey })
      : TopicInputSchema.safeParse({ name: fields.name, iconKey: fields.iconKey });

    if (!parsed.success) {
      const errors = mapZodFieldErrorsFlat(parsed.error) as Partial<Record<keyof TopicFormValues, string>>;
      setFieldErrors(errors);
      return { ok: false, fieldErrors: errors };
    }

    setFieldErrors({});
    setStatus('submitting');

    if (isEdit) {
      mutateUpdate(parsed.data as UpdateTopicInput);
    } else {
      mutateCreate(parsed.data as TopicInput);
    }
    return { ok: true };
  };

  const remove = () => {
    if (!isEdit || isDeleting) return;
    mutateDelete();
  };

  return {
    isEdit,
    values: fields,
    fieldErrors,
    isDirty,
    status,
    slug: topicQuery.data?.slug ?? '',
    questionCount: topicQuery.data?.questionCount ?? 0,
    exerciseCount: topicQuery.data?.exerciseCount ?? 0,
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
  };
}
