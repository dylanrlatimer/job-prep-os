'use client';

import { createContext, useContext } from 'react';

export type UnsavedChangesContextValue = {
  registerGuard: (id: string, isDirty: boolean) => void;
  unregisterGuard: (id: string) => void;
  allowNavigation: (fn: () => void) => void;
};

export const UnsavedChangesContext = createContext<UnsavedChangesContextValue | null>(null);

export function useUnsavedChangesContext(): UnsavedChangesContextValue {
  const context = useContext(UnsavedChangesContext);

  if (!context) {
    throw new Error('useUnsavedChangesContext must be used within UnsavedChangesProvider');
  }

  return context;
}
