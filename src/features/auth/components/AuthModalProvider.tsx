'use client';

import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { AuthModalContext, type AuthModalNext } from '@/features/auth/auth-modal-context';
import AuthModal from './AuthModal';

type AuthModalProviderProps = {
  children: ReactNode;
};

export default function AuthModalProvider({ children }: AuthModalProviderProps) {
  const [open, setOpen] = useState(false);
  const [next, setNext] = useState<AuthModalNext | null>(null);

  const openModal = useCallback((nextPath?: AuthModalNext) => {
    setNext(nextPath ?? null);
    setOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setOpen(false);
    setNext(null);
  }, []);

  const contextValue = useMemo(
    () => ({
      open: openModal,
      close: closeModal,
    }),
    [closeModal, openModal],
  );

  return (
    <AuthModalContext.Provider value={contextValue}>
      {children}
      <AuthModal open={open} next={next} onClose={closeModal} />
    </AuthModalContext.Provider>
  );
}
