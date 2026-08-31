'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { JSONContent } from '@tiptap/core';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { QueryClient } from '@tanstack/react-query';
import { useRouter } from '@/i18n/navigation';
import type { TiptapEditorRef } from '@/common/components/TiptapEditor';
import { useUnsavedChangesGuard, useReleaseUnsavedGuard } from '@/common/unsaved-changes/use-unsaved-changes-guard';
import { mapZodFieldErrorsFlat } from '@/common/lib/map-zod-field-errors';
import { QuestionInputSchema } from '@/features/theory/builder/api/contracts';
import type { CreateQuestionInput, UpdateQuestionInput } from '@/features/theory/builder/api/contracts';
import { createQuestion, updateQuestion, deleteQuestion } from '@/features/theory/builder/api/mutations';
import { builderMetadataQueryOptions, questionDetailQueryOptions } from '@/features/theory/builder/api/queries';
import { createSystemQuestion, updateSystemQuestion, deleteSystemQuestion } from '@/features/admin/questions/api/mutations';
import { systemQuestionQueryOptions } from '@/features/admin/questions/api/queries';
import { invalidateQuestionCaches, invalidateRepositoryCache, removeQuestionCaches } from '@/features/theory/api/invalidate-question-caches';
import { invalidateAdminQuestionCaches } from '@/features/admin/api/invalidate-admin-caches';
import { areQuestionValuesEqual, emptyQuestionFields, type QuestionFields, type QuestionFormValues } from '@/features/theory/builder/lib/question-form-values';
import { useToastStore } from '@/lib/store/use-toast-store';

export type { QuestionFormValues } from '@/features/theory/builder/lib/question-form-values';

// Minimal router interface — avoids importing the full next-intl type.
type RouteNavigator = {
  push: (href: string) => void;
  replace: (href: string) => void;
};

export type BuilderToastMessages = {
  createSuccess: string;
  updateSuccess: string;
  deleteSuccess: string;
};

// Encapsulates everything that differs between the user and admin variants:
// which API functions to call, and what to do after save/delete (navigate + invalidate).
export type QuestionApiLayer = {
  variant: 'user' | 'admin';
  create: (payload: CreateQuestionInput) => Promise<{ id: string }>;
  update: (id: string, payload: UpdateQuestionInput) => Promise<{ id: string }>;
  delete: (id: string) => Promise<{ id: string }>;
  afterSave: (args: { queryClient: QueryClient; router: RouteNavigator; id: string }) => void;
  afterDelete: (args: { queryClient: QueryClient; router: RouteNavigator; questionId: string }) => void;
};

export const userQuestionApiLayer: QuestionApiLayer = {
  variant: 'user',
  create: createQuestion,
  update: updateQuestion,
  delete: deleteQuestion,
  afterSave: ({ queryClient, router, id }) => {
    router.replace(`/theory/${id}`);
    void invalidateQuestionCaches(queryClient, id);
  },
  afterDelete: ({ queryClient, router, questionId }) => {
    removeQuestionCaches(queryClient, questionId);
    router.replace('/');
    void invalidateRepositoryCache(queryClient);
  },
};

export const adminQuestionApiLayer: QuestionApiLayer = {
  variant: 'admin',
  create: createSystemQuestion,
  update: updateSystemQuestion,
  delete: deleteSystemQuestion,
  afterSave: ({ queryClient, router, id }) => {
    router.push(`/admin/questions/${id}`);
    void invalidateAdminQuestionCaches(queryClient, id);
  },
  afterDelete: ({ queryClient, router, questionId }) => {
    router.push('/admin/questions');
    void invalidateAdminQuestionCaches(queryClient, questionId);
  },
};

export type QuestionBuilderSubmitResult = { ok: true } | { ok: false; fieldErrors: Partial<Record<keyof QuestionFormValues, string>> };

export const questionBuilderFieldOrder = ['question', 'answer', 'topicIds', 'sourceName', 'sourceUrl'] as const;

type UseQuestionBuilderFormOptions = {
  questionId?: string;
  apiLayer: QuestionApiLayer;
  toastMessages: BuilderToastMessages;
};

export function useQuestionBuilderForm({ questionId, apiLayer, toastMessages }: UseQuestionBuilderFormOptions) {
  const router = useRouter();
  const releaseGuard = useReleaseUnsavedGuard();
  const queryClient = useQueryClient();
  const isEdit = !!questionId;
  const isAdmin = apiLayer.variant === 'admin';

  // --- Data fetching ---
  // Two separate queries are necessary because user and admin endpoints return different
  // response shapes, and TypeScript cannot unify them into a single useQuery call.
  // Only one is ever enabled at a time.
  const userQuestionQuery = useQuery({
    ...questionDetailQueryOptions(questionId ?? ''),
    enabled: isEdit && !isAdmin,
  });
  const adminQuestionQuery = useQuery({
    ...systemQuestionQueryOptions(questionId ?? ''),
    enabled: isEdit && isAdmin,
  });
  const questionQuery = isAdmin ? adminQuestionQuery : userQuestionQuery;
  const metadataQuery = useQuery(builderMetadataQueryOptions);

  const isDataLoading = metadataQuery.isPending || (isEdit && questionQuery.isPending);
  const isDataError = metadataQuery.isError || (isEdit && questionQuery.isError);

  // --- Loaded data ---
  // Computed synchronously each render so that loadedFieldsRef is always current,
  // even before the seeding effect has run.
  const loadedFields = useMemo((): QuestionFields | null => {
    const data = questionQuery.data;
    if (!data) return null;
    return {
      question: data.question,
      topicIds: data.topicIds,
      sourceName: data.sourceName ?? '',
      sourceUrl: data.sourceUrl ?? '',
      isPublic: data.isPublic,
    };
  }, [questionQuery.data]);

  // Ref updated every render so callbacks can always read the latest loaded fields
  // without carrying it as a dependency.
  const loadedFieldsRef = useRef(loadedFields);
  loadedFieldsRef.current = loadedFields;

  // The form is considered ready to render only once loaded data is available (edit mode).
  // This ensures TipTap only mounts after initialContent is known.
  const isFormDataReady = !isEdit || loadedFields !== null;

  // --- Form state ---
  const editorRef = useRef<TiptapEditorRef>(null);
  const [fields, setFields] = useState<QuestionFields>(emptyQuestionFields);
  const [savedValues, setSavedValues] = useState<QuestionFormValues | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'submitting'>('loading');
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof QuestionFormValues, string>>>({});

  // Bumped each time TipTap fires onUpdate. Causes isDirty to re-evaluate reactively,
  // since TipTap content lives in the editor DOM and does not trigger React re-renders.
  const [docRevision, setDocRevision] = useState(0);

  // Ref updated every render so mutation success handlers can read the latest field
  // values without stale closure risk.
  const fieldsRef = useRef(fields);
  fieldsRef.current = fields;

  const initialDocument = questionQuery.data?.answer ?? null;

  // Seed field state when loaded data arrives (also re-seeds on query refresh).
  useEffect(() => {
    if (loadedFields) setFields(loadedFields);
  }, [loadedFields]);

  // --- Dirty detection ---
  const isDirty = useMemo(() => {
    if (status !== 'ready' || savedValues === null) return false;
    return !areQuestionValuesEqual(savedValues, {
      ...fields,
      answer: editorRef.current?.getJSON() ?? null,
    });
    // docRevision forces re-evaluation when TipTap fires onUpdate
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fields, savedValues, status, docRevision]);

  useUnsavedChangesGuard(status === 'ready' && isDirty && !isDataError);

  // --- Editor callbacks ---
  // Called once when TipTap mounts. At that point loaded data may not yet be in
  // React state (seeding effect hasn't run), so we read from loadedFieldsRef instead.
  const onEditorReady = useCallback((document: JSONContent) => {
    const currentFields = loadedFieldsRef.current ?? emptyQuestionFields;
    setSavedValues({ ...currentFields, answer: document });
    setStatus('ready');
  }, []);

  const onDocumentUpdate = useCallback(() => {
    setDocRevision((n) => n + 1);
  }, []);

  // --- Field setters ---
  const setField = useCallback(<K extends keyof QuestionFields>(field: K, value: QuestionFields[K]) => {
    setFields((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  }, []);

  const toggleTopic = useCallback((topicId: string) => {
    setFields((current) => ({
      ...current,
      topicIds: current.topicIds.includes(topicId) ? current.topicIds.filter((id) => id !== topicId) : [...current.topicIds, topicId],
    }));
    setFieldErrors((current) => {
      if (!current.topicIds) return current;
      const next = { ...current };
      delete next.topicIds;
      return next;
    });
  }, []);

  // --- Mutations ---
  const onSaveSuccess = (id: string) => {
    const currentDoc = editorRef.current?.getJSON() ?? null;
    setSavedValues({ ...fieldsRef.current, answer: currentDoc });
    setStatus('ready');
    releaseGuard();
    useToastStore.getState().addToast(isEdit ? toastMessages.updateSuccess : toastMessages.createSuccess, 'success');
    apiLayer.afterSave({ queryClient, router, id });
  };

  const onDeleteSuccess = () => {
    if (!questionId) return;
    releaseGuard();
    useToastStore.getState().addToast(toastMessages.deleteSuccess, 'success');
    apiLayer.afterDelete({ queryClient, router, questionId });
  };

  const { mutate: mutateCreate, isPending: isCreating } = useMutation({
    mutationFn: (payload: CreateQuestionInput) => apiLayer.create(payload),
    onSuccess: (response) => onSaveSuccess(response.id),
  });

  const { mutate: mutateUpdate, isPending: isUpdating } = useMutation({
    mutationFn: (payload: UpdateQuestionInput) => apiLayer.update(questionId!, payload),
    onSuccess: (response) => onSaveSuccess(response.id),
  });

  const { mutate: mutateDelete, isPending: isDeleting } = useMutation({
    mutationFn: () => apiLayer.delete(questionId!),
    onSuccess: onDeleteSuccess,
  });

  const isSubmitting = isCreating || isUpdating;

  // --- Submit ---
  const submit = (): QuestionBuilderSubmitResult => {
    const payload = {
      ...fieldsRef.current,
      answer: editorRef.current?.getJSON() ?? null,
    };
    const parsed = QuestionInputSchema.safeParse(payload);

    if (!parsed.success) {
      const errors = mapZodFieldErrorsFlat(parsed.error) as Partial<Record<keyof QuestionFormValues, string>>;
      setFieldErrors(errors);
      return { ok: false, fieldErrors: errors };
    }

    setFieldErrors({});
    setStatus('submitting');

    if (isEdit) {
      mutateUpdate(parsed.data);
    } else {
      mutateCreate(parsed.data);
    }
    return { ok: true };
  };

  const remove = () => {
    if (!isEdit || isDeleting) return;
    mutateDelete();
  };

  const refetch = () => {
    void metadataQuery.refetch();
    if (isEdit) void questionQuery.refetch();
  };

  return {
    isEdit,
    values: fields,
    fieldErrors,
    isDirty,
    status,
    initialDocument,
    editorRef,
    metadata: metadataQuery.data,
    isLoading: isDataLoading,
    isError: isDataError,
    isFormDataReady,
    isSubmitting,
    isDeleting,
    submit,
    setField,
    toggleTopic,
    onEditorReady,
    onDocumentUpdate,
    remove,
    refetch,
  };
}
