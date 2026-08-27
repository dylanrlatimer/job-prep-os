'use client';

import { useCallback, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from '@/i18n/navigation';
import { sessionQueryOptions } from '@/features/auth/api/queries';
import { signIn, signUp } from '@/features/auth/api/mutations';
import { authKeys } from '@/features/auth/api/query-keys';

export function useAuthForm(isSignUp: boolean) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: session, isLoading: sessionLoading } = useQuery(sessionQueryOptions);
  const user = session?.user ?? null;

  const onSuccess = useCallback(async () => {
    await queryClient.refetchQueries({ queryKey: authKeys.session() });
    router.refresh();
    router.replace('/');
  }, [queryClient, router]);

  const { mutate: mutateSignIn, isPending: isSignInPending } = useMutation({
    mutationFn: signIn,
    onSuccess,
  });

  const { mutate: mutateSignUp, isPending: isSignUpPending } = useMutation({
    mutationFn: signUp,
    onSuccess,
  });

  const loading = isSignInPending || isSignUpPending;

  const submit = useCallback(
    (payload: { email: string; password: string; username?: string }) => {
      const email = payload.email.trim();
      const password = payload.password;
      if (isSignUp) {
        mutateSignUp({ email, password });
      } else {
        mutateSignIn({ email, password });
      }
    },
    [isSignUp, mutateSignIn, mutateSignUp],
  );

  return useMemo(() => ({ sessionLoading, user, loading, submit }), [sessionLoading, user, loading, submit]);
}
