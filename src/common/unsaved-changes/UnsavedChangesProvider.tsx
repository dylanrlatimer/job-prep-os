'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { usePathname } from '@/i18n/navigation';
import UnsavedChangesDialog from './UnsavedChangesDialog';
import { isModifiedClick, isSameNavigationTarget, resolveInternalNavigationHref } from './navigation';
import type { PendingNavigation } from './types';
import { UnsavedChangesContext } from './unsaved-changes-context';

type UnsavedChangesProviderProps = {
  children: ReactNode;
};

export default function UnsavedChangesProvider({ children }: UnsavedChangesProviderProps) {
  const pathname = usePathname();
  const guardsRef = useRef(new Map<string, boolean>());
  const bypassRef = useRef(false);
  const historyTrapActiveRef = useRef(false);
  const pendingNavigationRef = useRef<PendingNavigation | null>(null);

  const [isBlocking, setIsBlocking] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const effectiveBlocking = isBlocking && !isLeaving;

  const syncBlockingState = useCallback(() => {
    const nextIsBlocking = [...guardsRef.current.values()].some(Boolean);
    setIsBlocking(nextIsBlocking);
    return nextIsBlocking;
  }, []);

  const registerGuard = useCallback(
    (id: string, isDirty: boolean) => {
      guardsRef.current.set(id, isDirty);
      syncBlockingState();
    },
    [syncBlockingState],
  );

  const unregisterGuard = useCallback(
    (id: string) => {
      guardsRef.current.delete(id);
      syncBlockingState();
    },
    [syncBlockingState],
  );

  /** Collapse trap entry in place — safe before App Router navigation. */
  const disarmHistoryTrapInPlace = useCallback(() => {
    if (!historyTrapActiveRef.current) return;

    historyTrapActiveRef.current = false;
    window.history.replaceState(window.history.state, '', window.location.href);
  }, []);

  /** Pop trap entry — used only when user confirms back-button leave. */
  const disarmHistoryTrapForBackNavigation = useCallback(() => {
    if (!historyTrapActiveRef.current) return;

    historyTrapActiveRef.current = false;
    window.history.back();
  }, []);

  const releaseGuard = useCallback(() => {
    setIsLeaving(true);
    bypassRef.current = true;

    for (const id of guardsRef.current.keys()) {
      guardsRef.current.set(id, false);
    }
    setIsBlocking(false);

    disarmHistoryTrapInPlace();
  }, [disarmHistoryTrapInPlace]);

  const beginConfirmedLeave = useCallback(() => {
    setIsLeaving(true);
    bypassRef.current = true;
    disarmHistoryTrapForBackNavigation();
  }, [disarmHistoryTrapForBackNavigation]);

  const requestNavigation = useCallback((navigation: PendingNavigation) => {
    pendingNavigationRef.current = navigation;
    setDialogOpen(true);
  }, []);

  const confirmLeave = useCallback(
    (pending: PendingNavigation) => {
      beginConfirmedLeave();

      if (pending.type === 'back') {
        window.history.go(-2);
        return;
      }

      window.location.assign(pending.href);
    },
    [beginConfirmedLeave],
  );

  const handleStay = useCallback(() => {
    pendingNavigationRef.current = null;
    setDialogOpen(false);
  }, []);

  const handleLeave = useCallback(() => {
    const pending = pendingNavigationRef.current;
    pendingNavigationRef.current = null;
    setDialogOpen(false);

    if (!pending) return;

    confirmLeave(pending);
  }, [confirmLeave]);

  useEffect(() => {
    setIsLeaving(false);
    bypassRef.current = false;
  }, [pathname]);

  useEffect(() => {
    if (!effectiveBlocking) return;

    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (bypassRef.current) return;
      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [effectiveBlocking]);

  useEffect(() => {
    if (!effectiveBlocking || dialogOpen) return;

    const onClick = (event: MouseEvent) => {
      if (bypassRef.current) return;

      const anchor = (event.target as HTMLElement | null)?.closest('a');
      if (!(anchor instanceof HTMLAnchorElement)) return;
      if (isModifiedClick(event)) return;

      const href = resolveInternalNavigationHref(anchor);
      if (!href) return;
      if (isSameNavigationTarget(window.location.pathname + window.location.search + window.location.hash, href)) return;

      event.preventDefault();
      event.stopPropagation();
      requestNavigation({ type: 'href', href });
    };

    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, [dialogOpen, effectiveBlocking, requestNavigation]);

  useEffect(() => {
    if (!effectiveBlocking || dialogOpen) {
      return;
    }

    const trapHistory = () => {
      window.history.pushState({ unsavedChangesGuard: true }, '', window.location.href);
      historyTrapActiveRef.current = true;
    };

    trapHistory();

    const onPopState = () => {
      if (bypassRef.current) return;

      trapHistory();
      requestNavigation({ type: 'back' });
    };

    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [dialogOpen, effectiveBlocking, requestNavigation]);

  const contextValue = useMemo(
    () => ({
      registerGuard,
      unregisterGuard,
      releaseGuard,
    }),
    [registerGuard, releaseGuard, unregisterGuard],
  );

  return (
    <UnsavedChangesContext.Provider value={contextValue}>
      {children}
      <UnsavedChangesDialog open={dialogOpen} onStay={handleStay} onLeave={handleLeave} />
    </UnsavedChangesContext.Provider>
  );
}
