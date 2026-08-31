'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { JSONContent } from '@tiptap/core';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { QueryClient } from '@tanstack/react-query';
import { useRouter } from '@/i18n/navigation';
import type { TiptapEditorRef } from '@/common/components/TiptapEditor';
import { useUnsavedChangesGuard, useReleaseUnsavedGuard } from '@/common/unsaved-changes/use-unsaved-changes-guard';
import { mapZodFieldErrorsNested } from '@/common/lib/map-zod-field-errors';
import { invalidateAdminExerciseCaches } from '@/features/admin/api/invalidate-admin-caches';
import { createSystemExercise, deleteSystemExercise, updateSystemExercise } from '@/features/admin/exercises/api/mutations';
import { systemExerciseQueryOptions } from '@/features/admin/exercises/api/queries';
import { ExerciseInputSchema } from '@/features/exercises/builder/api/contracts';
import type { CreateExerciseInput, UpdateExerciseInput } from '@/features/exercises/builder/api/contracts';
import { createExercise, deleteExercise, updateExercise } from '@/features/exercises/builder/api/mutations';
import { builderMetadataQueryOptions, exerciseDetailQueryOptions } from '@/features/exercises/builder/api/queries';
import {
  areExerciseSnapshotsEqual,
  createChoiceRowFromLoaded,
  emptyExerciseFields,
  MAX_CHOICES,
  MIN_CHOICES,
  toExerciseSnapshot,
  type ExerciseChoiceDocument,
  type ExerciseFields,
  type ExerciseFormSnapshot,
} from '@/features/exercises/builder/lib/exercise-form-values';
import { invalidateExerciseCaches, invalidateExerciseRepositoryCache, removeExerciseCaches } from '@/features/exercises/api/invalidate-caches';
import { useToastStore } from '@/lib/store/use-toast-store';

export type { ExerciseFormValues } from '@/features/exercises/builder/lib/exercise-form-values';

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
export type ExerciseApiLayer = {
  variant: 'user' | 'admin';
  create: (payload: CreateExerciseInput) => Promise<{ id: string }>;
  update: (id: string, payload: UpdateExerciseInput) => Promise<{ id: string }>;
  delete: (id: string) => Promise<{ id: string }>;
  afterSave: (args: { queryClient: QueryClient; router: RouteNavigator; id: string }) => void;
  afterDelete: (args: { queryClient: QueryClient; router: RouteNavigator; exerciseId: string }) => void;
};

export const userExerciseApiLayer: ExerciseApiLayer = {
  variant: 'user',
  create: createExercise,
  update: updateExercise,
  delete: deleteExercise,
  afterSave: ({ queryClient, router, id }) => {
    router.replace(`/exercises/${id}`);
    void invalidateExerciseCaches(queryClient, id);
  },
  afterDelete: ({ queryClient, router, exerciseId }) => {
    removeExerciseCaches(queryClient, exerciseId);
    router.replace('/exercises');
    void invalidateExerciseRepositoryCache(queryClient);
  },
};

export const adminExerciseApiLayer: ExerciseApiLayer = {
  variant: 'admin',
  create: createSystemExercise,
  update: updateSystemExercise,
  delete: deleteSystemExercise,
  afterSave: ({ queryClient, router, id }) => {
    router.push(`/admin/exercises/${id}`);
    void invalidateAdminExerciseCaches(queryClient, id);
  },
  afterDelete: ({ queryClient, router, exerciseId }) => {
    router.push('/admin/exercises');
    void invalidateAdminExerciseCaches(queryClient, exerciseId);
  },
};

export type ExerciseBuilderSubmitResult = { ok: true } | { ok: false; fieldErrors: Record<string, string> };

export const exerciseBuilderFieldOrder = ['title', 'prompt', 'explanation', 'choices', 'topicIds', 'sourceName', 'sourceUrl'] as const;

type UseExerciseBuilderFormOptions = {
  exerciseId?: string;
  apiLayer: ExerciseApiLayer;
  toastMessages: BuilderToastMessages;
};

export function useExerciseBuilderForm({ exerciseId, apiLayer, toastMessages }: UseExerciseBuilderFormOptions) {
  const router = useRouter();
  const releaseGuard = useReleaseUnsavedGuard();
  const queryClient = useQueryClient();
  const isEdit = !!exerciseId;
  const isAdmin = apiLayer.variant === 'admin';

  const promptRef = useRef<TiptapEditorRef>(null);
  const explanationRef = useRef<TiptapEditorRef>(null);
  const choiceEditorRefs = useRef(new Map<string, TiptapEditorRef | null>());

  const [fields, setFields] = useState<ExerciseFields>(emptyExerciseFields);
  const [status, setStatus] = useState<'loading' | 'ready' | 'submitting'>('loading');
  const [committedSnapshot, setCommittedSnapshot] = useState<ExerciseFormSnapshot | null>(null);
  const [docRevision, setDocRevision] = useState(0);
  const [readyEditorIds, setReadyEditorIds] = useState<Set<string>>(() => new Set());
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // --- Data fetching ---
  // Two separate queries for TypeScript safety (user and admin return different shapes).
  // Only one is ever enabled at a time.
  const metadataQuery = useQuery(builderMetadataQueryOptions);
  const userExerciseQuery = useQuery({
    ...exerciseDetailQueryOptions(exerciseId ?? ''),
    enabled: isEdit && !isAdmin,
  });
  const adminExerciseQuery = useQuery({
    ...systemExerciseQueryOptions(exerciseId ?? ''),
    enabled: isEdit && isAdmin,
  });
  const exerciseQuery = isAdmin ? adminExerciseQuery : userExerciseQuery;

  const initialPrompt = exerciseQuery.data?.prompt ?? null;
  const initialExplanation = exerciseQuery.data?.explanation ?? null;

  const isDataLoading = metadataQuery.isPending || (isEdit && exerciseQuery.isPending);
  const isDataError = metadataQuery.isError || (isEdit && exerciseQuery.isError);

  // Computed synchronously each render so loadedFieldsRef is always current
  // (exercise builder relies on the same pattern as question builder).
  const loadedFields = useMemo((): ExerciseFields | null => {
    const data = exerciseQuery.data;
    if (!data) return null;
    return {
      title: data.title,
      topicIds: data.topicIds,
      sourceName: data.sourceName ?? '',
      sourceUrl: data.sourceUrl ?? '',
      isPublic: data.isPublic,
      allowMultiple: data.allowMultiple,
      choices: data.choices.map((choice) => createChoiceRowFromLoaded(choice.isCorrect)),
    };
  }, [exerciseQuery.data]);

  // The set of editor IDs that must all be mounted before the form is usable.
  // Changes when choices are added or removed.
  const expectedEditorIds = useMemo(() => ['prompt', 'explanation', ...fields.choices.map((choice) => choice.id)], [fields.choices]);

  // Seed field state when loaded data arrives (also re-seeds on query refresh).
  useEffect(() => {
    if (!isEdit) {
      setFields(emptyExerciseFields);
      return;
    }
    if (loadedFields) setFields(loadedFields);
  }, [isEdit, loadedFields]);

  // --- Document helpers ---
  const getChoiceDocuments = useCallback((): ExerciseChoiceDocument[] => {
    return fields.choices.map((choice) => ({
      id: choice.id,
      content: choiceEditorRefs.current.get(choice.id)?.getJSON() ?? null,
    }));
  }, [fields.choices]);

  const getSnapshot = useCallback((): ExerciseFormSnapshot => {
    return toExerciseSnapshot(fields, promptRef.current?.getJSON() ?? null, explanationRef.current?.getJSON() ?? null, getChoiceDocuments());
  }, [getChoiceDocuments, fields]);

  // --- Readiness ---
  // Status becomes 'ready' once all expected editors are mounted AND (in edit mode) data is loaded.
  // This guarantees editor initial content is set before the committed snapshot is captured.
  useEffect(() => {
    if (isDataLoading || isDataError) return;
    if (!expectedEditorIds.every((id) => readyEditorIds.has(id))) return;
    if (!isEdit || loadedFields) {
      setCommittedSnapshot(getSnapshot());
      setStatus('ready');
    }
  }, [expectedEditorIds, getSnapshot, isDataError, isDataLoading, isEdit, loadedFields, readyEditorIds]);

  // --- Dirty detection ---
  const isDirty = useMemo(() => {
    if (status !== 'ready' || committedSnapshot === null) return false;
    return !areExerciseSnapshotsEqual(committedSnapshot, getSnapshot());
    // docRevision forces re-evaluation when any TipTap editor fires onUpdate
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [committedSnapshot, docRevision, getSnapshot, fields, status]);

  useUnsavedChangesGuard(status === 'ready' && isDirty && !isDataError);

  // --- Editor callbacks ---
  const onEditorReady = useCallback((editorId: string) => {
    return (_document: JSONContent) => {
      setReadyEditorIds((current) => {
        const next = new Set(current);
        next.add(editorId);
        return next;
      });
    };
  }, []);

  const onDocumentUpdate = useCallback(() => {
    setDocRevision((n) => n + 1);
  }, []);

  const setChoiceEditorRef = useCallback((choiceId: string) => {
    return (instance: TiptapEditorRef | null) => {
      if (instance) {
        choiceEditorRefs.current.set(choiceId, instance);
      } else {
        choiceEditorRefs.current.delete(choiceId);
      }
    };
  }, []);

  // --- Field setters ---
  const setField = useCallback(<K extends keyof ExerciseFields>(field: K, value: ExerciseFields[K]) => {
    setFields((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => {
      if (!current[field as string]) return current;
      const next = { ...current };
      delete next[field as string];
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

  const setChoiceCorrect = useCallback((choiceId: string, isCorrect: boolean) => {
    setFields((current) => ({
      ...current,
      choices: current.choices.map((choice) => (choice.id === choiceId ? { ...choice, isCorrect } : choice)),
    }));
    setFieldErrors((current) => {
      if (!current.choices) return current;
      const next = { ...current };
      delete next.choices;
      return next;
    });
  }, []);

  const addChoice = useCallback(() => {
    setFields((current) => {
      if (current.choices.length >= MAX_CHOICES) return current;
      return { ...current, choices: [...current.choices, createChoiceRowFromLoaded(false)] };
    });
  }, []);

  const removeChoice = useCallback((choiceId: string) => {
    setFields((current) => {
      if (current.choices.length <= MIN_CHOICES) return current;

      choiceEditorRefs.current.delete(choiceId);
      setReadyEditorIds((ready) => {
        const next = new Set(ready);
        next.delete(choiceId);
        return next;
      });

      return {
        ...current,
        choices: current.choices.filter((choice) => choice.id !== choiceId),
      };
    });
  }, []);

  // --- Mutations ---
  const onSaveSuccess = (id: string) => {
    setCommittedSnapshot(getSnapshot());
    setStatus('ready');
    releaseGuard();
    useToastStore.getState().addToast(isEdit ? toastMessages.updateSuccess : toastMessages.createSuccess, 'success');
    apiLayer.afterSave({ queryClient, router, id });
  };

  const onDeleteSuccess = () => {
    if (!exerciseId) return;
    releaseGuard();
    useToastStore.getState().addToast(toastMessages.deleteSuccess, 'success');
    apiLayer.afterDelete({ queryClient, router, exerciseId });
  };

  const { mutate: mutateCreate, isPending: isCreating } = useMutation({
    mutationFn: (payload: CreateExerciseInput) => apiLayer.create(payload),
    onSuccess: (response) => onSaveSuccess(response.id),
  });

  const { mutate: mutateUpdate, isPending: isUpdating } = useMutation({
    mutationFn: (payload: UpdateExerciseInput) => apiLayer.update(exerciseId!, payload),
    onSuccess: (response) => onSaveSuccess(response.id),
  });

  const { mutate: mutateDelete, isPending: isDeleting } = useMutation({
    mutationFn: () => apiLayer.delete(exerciseId!),
    onSuccess: onDeleteSuccess,
  });

  const isSubmitting = isCreating || isUpdating;

  // --- Submit ---
  const submit = (): ExerciseBuilderSubmitResult => {
    const snapshot = getSnapshot();
    const parsed = ExerciseInputSchema.safeParse({
      title: snapshot.title,
      prompt: snapshot.prompt!,
      explanation: snapshot.explanation,
      topicIds: snapshot.topicIds,
      sourceName: snapshot.sourceName,
      sourceUrl: snapshot.sourceUrl,
      isPublic: snapshot.isPublic,
      allowMultiple: snapshot.allowMultiple,
      choices: snapshot.choices.map((choice, index) => ({
        content: snapshot.choiceDocuments[index]?.content!,
        isCorrect: choice.isCorrect,
      })),
    });

    if (!parsed.success) {
      const errors = mapZodFieldErrorsNested(parsed.error);
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

  const getInitialChoiceContent = useCallback(
    (choiceId: string, index: number) => {
      if (!isEdit || !exerciseQuery.data) return null;
      return exerciseQuery.data.choices[index]?.content ?? null;
    },
    [exerciseQuery.data, isEdit],
  );

  return {
    isEdit,
    values: fields,
    fieldErrors,
    isDirty,
    status,
    initialPrompt,
    initialExplanation,
    promptRef,
    explanationRef,
    metadata: metadataQuery.data,
    isLoading: isDataLoading,
    isError: isDataError,
    isFormDataReady: !isEdit || loadedFields !== null,
    isSubmitting,
    isDeleting,
    submit,
    setField,
    toggleTopic,
    setChoiceCorrect,
    addChoice,
    removeChoice,
    onPromptReady: onEditorReady('prompt'),
    onExplanationReady: onEditorReady('explanation'),
    onChoiceReady: (choiceId: string) => onEditorReady(choiceId),
    onDocumentUpdate,
    setChoiceEditorRef,
    getInitialChoiceContent,
    remove,
    refetch: () => {
      void metadataQuery.refetch();
      if (isEdit) void exerciseQuery.refetch();
    },
    minChoices: MIN_CHOICES,
    maxChoices: MAX_CHOICES,
  };
}
