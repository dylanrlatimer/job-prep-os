'use client';

import { useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { sessionQueryOptions } from '@/features/auth/api/queries';
import { useAuthModal } from '@/features/auth/auth-modal-context';

export function useRequireAuth() {
  const { data: session } = useQuery(sessionQueryOptions);
  const { open } = useAuthModal();
  const user = session?.user ?? null;

  const requireAuth = useCallback(() => {
    if (user) return true;
    open();
    return false;
  }, [open, user]);

  return { user, requireAuth };
}
