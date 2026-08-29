'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { JSONContent } from '@tiptap/core';
import type { TiptapEditorRef } from '@/common/components/TiptapEditor';

export type FormStatus = 'loading' | 'ready' | 'submitting';

type UseSnapshotFormOptions<TSnapshot, TScalars> = {
  isEdit: boolean;
  emptyScalars: TScalars;
  loadedScalars: TScalars | null;
  isDataLoading: boolean;
  isDataError: boolean;
  hasDocumentField: boolean;
  toSnapshot: (scalars: TScalars, document: JSONContent | null) => TSnapshot;
  snapshotsEqual: (left: TSnapshot, right: TSnapshot) => boolean;
};

export function useSnapshotForm<TSnapshot, TScalars>({
  isEdit,
  emptyScalars,
  loadedScalars,
  isDataLoading,
  isDataError,
  hasDocumentField,
  toSnapshot,
  snapshotsEqual,
}: UseSnapshotFormOptions<TSnapshot, TScalars>) {
  const editorRef = useRef<TiptapEditorRef>(null);
  const [scalars, setScalars] = useState<TScalars>(emptyScalars);
  const [status, setStatus] = useState<FormStatus>('loading');
  const [committedSnapshot, setCommittedSnapshot] = useState<TSnapshot | null>(null);
  const [documentRevision, setDocumentRevision] = useState(0);

  const scalarsRef = useRef(scalars);
  scalarsRef.current = scalars;

  const loadedScalarsRef = useRef(loadedScalars);
  loadedScalarsRef.current = loadedScalars;

  const toSnapshotRef = useRef(toSnapshot);
  toSnapshotRef.current = toSnapshot;

  const getDocument = useCallback((): JSONContent | null => {
    if (!hasDocumentField) return null;
    return editorRef.current?.getJSON() ?? null;
  }, [hasDocumentField]);

  const getSnapshot = useCallback((): TSnapshot => {
    return toSnapshotRef.current(scalarsRef.current, getDocument());
  }, [getDocument]);

  // Scalar-only forms: become ready once create loads or edit data arrives.
  useEffect(() => {
    if (hasDocumentField) return;

    if (!isEdit) {
      setCommittedSnapshot(toSnapshotRef.current(emptyScalars, null));
      setStatus('ready');
      return;
    }

    if (loadedScalars) {
      setScalars(loadedScalars);
      setCommittedSnapshot(toSnapshotRef.current(loadedScalars, null));
      setStatus('ready');
    }
  }, [emptyScalars, hasDocumentField, isEdit, loadedScalars]);

  // Document forms: sync scalars when edit data arrives (editor mounts separately).
  useEffect(() => {
    if (!hasDocumentField || !loadedScalars) return;
    setScalars(loadedScalars);
  }, [hasDocumentField, loadedScalars]);

  const onEditorReady = useCallback(
    (document: JSONContent) => {
      if (!hasDocumentField) return;

      if (loadedScalarsRef.current) {
        scalarsRef.current = loadedScalarsRef.current;
        setScalars(loadedScalarsRef.current);
      }

      setCommittedSnapshot(toSnapshotRef.current(scalarsRef.current, document));
      setStatus('ready');
    },
    [hasDocumentField],
  );

  const onDocumentUpdate = useCallback(() => {
    setDocumentRevision((revision) => revision + 1);
  }, []);

  const isDirty = useMemo(() => {
    if (status !== 'ready' || committedSnapshot === null) return false;
    return !snapshotsEqual(committedSnapshot, getSnapshot());
  }, [committedSnapshot, documentRevision, getSnapshot, scalars, snapshotsEqual, status]);

  const setScalar = useCallback(<K extends keyof TScalars>(field: K, value: TScalars[K]) => {
    setScalars((current) => ({ ...current, [field]: value }));
  }, []);

  const markSubmitting = useCallback(() => {
    setStatus('submitting');
  }, []);

  const commitSnapshot = useCallback(() => {
    setCommittedSnapshot(getSnapshot());
    setStatus('ready');
  }, [getSnapshot]);

  return {
    editorRef,
    scalars,
    status,
    isDirty,
    isDataLoading,
    isDataError,
    isFormDataReady: !isEdit || loadedScalars !== null,
    getSnapshot,
    setScalar,
    setScalars,
    onEditorReady,
    onDocumentUpdate,
    markSubmitting,
    commitSnapshot,
  };
}
