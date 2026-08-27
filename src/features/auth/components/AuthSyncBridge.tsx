'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { authKeys } from '@/features/auth/api/query-keys';
import { resetClientSession } from '@/features/auth/lib/reset-client-session';
import { supabase } from '@/lib/supabase/client';

export default function AuthSyncBridge() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        resetClientSession(queryClient);
      } else {
        queryClient.invalidateQueries({ queryKey: authKeys.session() });
      }
    });

    return () => subscription.unsubscribe();
  }, [queryClient]);

  return null;
}
