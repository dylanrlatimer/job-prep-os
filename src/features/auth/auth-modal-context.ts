'use client';

import { createContext, useContext } from 'react';

export type AuthModalNext = '/' | '/browse' | '/exercises' | '/practice';

export type AuthModalContextValue = {
  open: (next?: AuthModalNext) => void;
  close: () => void;
};

export const AuthModalContext = createContext<AuthModalContextValue | null>(null);

export function useAuthModal(): AuthModalContextValue {
  const context = useContext(AuthModalContext);

  if (!context) {
    throw new Error('useAuthModal must be used within AuthModalProvider');
  }

  return context;
}
