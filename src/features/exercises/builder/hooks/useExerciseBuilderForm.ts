'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { JSONContent } from '@tiptap/core';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from '@/i18n/navigation';
import type { TiptapEditorRef } from '@/common/components/TiptapEditor';
import { useReleaseUnsavedGuard } from '@/common/unsaved-changes/use-unsaved-changes-guard';
import { mapZodFieldErrorsNested } from '@/common/lib/map-zod-field-errors';
import { invalidateAdminExerciseCaches } from '@/features/admin/api/invalidate-admin-caches';
import { createSystemExercise, deleteSystemExercise, updateSystemExercise } from '@/features/admin/exercises/api/mutations';
import { systemExerciseQueryOptions } from '@/features/admin/exercises/api/queries';
import { ExerciseInputSchema } from '@/features/exercises/builder/api/contracts';
import { createExercise, deleteExercise, updateExercise } from '@/features/exercises/builder/api/mutations';
import { builderMetadataQueryOptions, exerciseDetailQueryOptions } from '@/features/exercises/builder/api/queries';
import {
  areExerciseSnapshotsEqual,
  createChoiceRowFromLoaded,
  emptyExerciseScalars,
  MAX_CHOICES,
  MIN_CHOICES,
  toExerciseSnapshot,
  type ExerciseChoiceDocument,
  type ExerciseFormSnapshot,
  type ExerciseScalars,
} from '@/features/exercises/builder/lib/exercise-form-values';
import { invalidateExerciseCaches, invalidateExerciseRepositoryCache, removeExerciseCaches } from '@/features/exercises/api/invalidate-caches';
import { useToastStore } from '@/lib/store/use-toast-store';

export type { ExerciseFormValues } from '@/features/exercises/builder/lib/exercise-form-values';

export type BuilderVariant = 'user' | 'admin';

export type BuilderToastMessages = {
  createSuccess: string;
  updateSuccess: string;
  deleteSuccess: string;
};

type FormStatus = 'loading' | 'ready' | 'submitting';

function toExerciseInput(snapshot: ExerciseFormSnapshot) {
  return {
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
  };
}

type UseExerciseBuilderFormOptions = {
  exerciseId?: string;
  variant: BuilderVariant;
  toastMessages: BuilderToastMessages;
};

export type ExerciseBuilderSubmitResult = { ok: true } | { ok: false; fieldErrors: Record<string, string> };

export const exerciseBuilderFieldOrder = ['title', 'prompt', 'explanation', 'choices', 'topicIds', 'sourceName', 'sourceUrl'] as const;

export function useExerciseBuilderForm({ exerciseId, variant, toastMessages }: UseExerciseBuilderFormOptions) {
  const router = useRouter();
  const releaseGuard = useReleaseUnsavedGuard();
  const queryClient = useQueryClient();
  const isEdit = !!exerciseId;
  const isAdmin = variant === 'admin';

  const promptRef = useRef<TiptapEditorRef>(null);
  const explanationRef = useRef<TiptapEditorRef>(null);
  const choiceEditorRefs = useRef(new Map<string, TiptapEditorRef | null>());

  const [scalars, setScalars] = useState<ExerciseScalars>(emptyExerciseScalars);
  const [status, setStatus] = useState<FormStatus>('loading');
  const [committedSnapshot, setCommittedSnapshot] = useState<ExerciseFormSnapshot | null>(null);
  const [documentRevision, setDocumentRevision] = useState(0);
  const [readyEditorIds, setReadyEditorIds] = useState<Set<string>>(() => new Set());
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

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

  const loadedScalars = useMemo((): ExerciseScalars | null => {
    if (!exerciseQuery.data) return null;

    return {
      title: exerciseQuery.data.title,
      topicIds: exerciseQuery.data.topicIds,
      sourceName: exerciseQuery.data.sourceName ?? '',
      sourceUrl: exerciseQuery.data.sourceUrl ?? '',
      isPublic: exerciseQuery.data.isPublic,
      allowMultiple: exerciseQuery.data.allowMultiple,
      choices: exerciseQuery.data.choices.map((choice) => createChoiceRowFromLoaded(choice.isCorrect)),
    };
  }, [exerciseQuery.data]);

  const expectedEditorIds = useMemo(() => ['prompt', 'explanation', ...scalars.choices.map((choice) => choice.id)], [scalars.choices]);

  const isDataLoading = metadataQuery.isPending || (isEdit && exerciseQuery.isPending);
  const isDataError = metadataQuery.isError || (isEdit && exerciseQuery.isError);

  useEffect(() => {
    if (!isEdit) {
      setScalars(emptyExerciseScalars);
      return;
    }

    if (loadedScalars) {
      setScalars(loadedScalars);
    }
  }, [isEdit, loadedScalars]);

  const getChoiceDocuments = useCallback((): ExerciseChoiceDocument[] => {
    return scalars.choices.map((choice) => ({
      id: choice.id,
      content: choiceEditorRefs.current.get(choice.id)?.getJSON() ?? null,
    }));
  }, [scalars.choices]);

  const getSnapshot = useCallback((): ExerciseFormSnapshot => {
    return toExerciseSnapshot(scalars, promptRef.current?.getJSON() ?? null, explanationRef.current?.getJSON() ?? null, getChoiceDocuments());
  }, [getChoiceDocuments, scalars]);

  useEffect(() => {
    if (isDataLoading || isDataError) return;

    if (!isEdit) {
      if (expectedEditorIds.every((editorId) => readyEditorIds.has(editorId))) {
        setCommittedSnapshot(getSnapshot());
        setStatus('ready');
      }
      return;
    }

    if (loadedScalars && expectedEditorIds.every((editorId) => readyEditorIds.has(editorId))) {
      setCommittedSnapshot(getSnapshot());
      setStatus('ready');
    }
  }, [expectedEditorIds, getSnapshot, isDataError, isDataLoading, isEdit, loadedScalars, readyEditorIds]);

  const isDirty = useMemo(() => {
    if (status !== 'ready' || committedSnapshot === null) return false;
    return !areExerciseSnapshotsEqual(committedSnapshot, getSnapshot());
  }, [committedSnapshot, documentRevision, getSnapshot, scalars, status]);

  const onEditorReady = useCallback((editorId: string) => {
    return (document: JSONContent) => {
      setReadyEditorIds((current) => {
        const next = new Set(current);
        next.add(editorId);
        return next;
      });

      void document;
    };
  }, []);

  const onDocumentUpdate = useCallback(() => {
    setDocumentRevision((revision) => revision + 1);
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

  const onSaveSuccess = useCallback(
    (id: string) => {
      setCommittedSnapshot(getSnapshot());
      setStatus('ready');
      releaseGuard();
      useToastStore.getState().addToast(isEdit ? toastMessages.updateSuccess : toastMessages.createSuccess, 'success');

      if (isAdmin) {
        router.push(`/admin/exercises/${id}`);
        void invalidateAdminExerciseCaches(queryClient, id);
        return;
      }

      router.replace(`/exercises/${id}`);
      void invalidateExerciseCaches(queryClient, id);
    },
    [getSnapshot, isAdmin, isEdit, queryClient, releaseGuard, router, toastMessages],
  );

  const onDeleteSuccess = useCallback(() => {
    if (!exerciseId) return;

    releaseGuard();
    useToastStore.getState().addToast(toastMessages.deleteSuccess, 'success');

    if (isAdmin) {
      router.push('/admin/exercises');
      void invalidateAdminExerciseCaches(queryClient, exerciseId);
      return;
    }

    removeExerciseCaches(queryClient, exerciseId);
    router.replace('/exercises');
    void invalidateExerciseRepositoryCache(queryClient);
  }, [exerciseId, isAdmin, queryClient, releaseGuard, router, toastMessages]);

  const { mutate: mutateCreate, isPending: isCreating } = useMutation({
    mutationFn: (payload: Parameters<typeof createExercise>[0]) => (isAdmin ? createSystemExercise(payload) : createExercise(payload)),
    onSuccess: (response) => onSaveSuccess(response.id),
  });

  const { mutate: mutateUpdate, isPending: isUpdating } = useMutation({
    mutationFn: (payload: Parameters<typeof updateExercise>[1]) =>
      isAdmin ? updateSystemExercise(exerciseId!, payload) : updateExercise(exerciseId!, payload),
    onSuccess: (response) => onSaveSuccess(response.id),
  });

  const { mutate: mutateDelete, isPending: isDeleting } = useMutation({
    mutationFn: () => (isAdmin ? deleteSystemExercise(exerciseId!) : deleteExercise(exerciseId!)),
    onSuccess: onDeleteSuccess,
  });

  const isSubmitting = isCreating || isUpdating;

  const submit = useCallback((): ExerciseBuilderSubmitResult => {
    const snapshot = getSnapshot();
    const parsed = ExerciseInputSchema.safeParse(toExerciseInput(snapshot));

    if (!parsed.success) {
      const errors = mapZodFieldErrorsNested(parsed.error);
      setFieldErrors(errors);
      return { ok: false, fieldErrors: errors };
    }

    setFieldErrors({});
    setStatus('submitting');

    if (isEdit) {
      mutateUpdate(parsed.data);
      return { ok: true };
    }

    mutateCreate(parsed.data);
    return { ok: true };
  }, [getSnapshot, isEdit, mutateCreate, mutateUpdate]);

  const setField = useCallback(<K extends keyof ExerciseScalars>(field: K, value: ExerciseScalars[K]) => {
    setScalars((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => {
      if (!current[field as string]) return current;
      const next = { ...current };
      delete next[field as string];
      return next;
    });
  }, []);

  const toggleTopic = useCallback((topicId: string) => {
    setScalars((current) => {
      const topicIds = current.topicIds.includes(topicId) ? current.topicIds.filter((id) => id !== topicId) : [...current.topicIds, topicId];

      return { ...current, topicIds };
    });

    setFieldErrors((current) => {
      if (!current.topicIds) return current;
      const next = { ...current };
      delete next.topicIds;
      return next;
    });
  }, []);

  const setChoiceCorrect = useCallback((choiceId: string, isCorrect: boolean) => {
    setScalars((current) => ({
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
    setScalars((current) => {
      if (current.choices.length >= MAX_CHOICES) return current;
      return {
        ...current,
        choices: [...current.choices, createChoiceRowFromLoaded(false)],
      };
    });
  }, []);

  const removeChoice = useCallback((choiceId: string) => {
    setScalars((current) => {
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

  const remove = useCallback(() => {
    if (!isEdit || isDeleting) return;
    mutateDelete();
  }, [isDeleting, isEdit, mutateDelete]);

  const getInitialChoiceContent = useCallback(
    (choiceId: string, index: number) => {
      if (!isEdit || !exerciseQuery.data) return null;
      return exerciseQuery.data.choices[index]?.content ?? null;
    },
    [exerciseQuery.data, isEdit],
  );

  return useMemo(
    () => ({
      isEdit,
      values: scalars,
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
      isFormDataReady: !isEdit || loadedScalars !== null,
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
    }),
    [
      addChoice,
      fieldErrors,
      getInitialChoiceContent,
      initialExplanation,
      initialPrompt,
      isDataError,
      isDataLoading,
      isDeleting,
      isDirty,
      isEdit,
      isSubmitting,
      loadedScalars,
      metadataQuery,
      exerciseQuery,
      onDocumentUpdate,
      onEditorReady,
      remove,
      removeChoice,
      scalars,
      setChoiceCorrect,
      setChoiceEditorRef,
      setField,
      status,
      submit,
      toggleTopic,
    ],
  );
}
