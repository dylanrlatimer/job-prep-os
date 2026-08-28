'use client';

import { useEffect, useId } from 'react';
import { useUnsavedChangesContext } from './unsaved-changes-context';

export function useUnsavedChangesGuard(isDirty: boolean) {
  const { registerGuard, unregisterGuard } = useUnsavedChangesContext();
  const id = useId();

  useEffect(() => {
    registerGuard(id, isDirty);
    return () => unregisterGuard(id);
  }, [id, isDirty, registerGuard, unregisterGuard]);
}

export function useAllowUnsavedNavigation() {
  return useUnsavedChangesContext().allowNavigation;
}
