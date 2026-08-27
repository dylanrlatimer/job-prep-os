'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useRouter, Link } from '@/i18n/navigation';
import { sessionQueryOptions } from '@/features/auth/api/queries';
import { signOut } from '@/features/auth/api/mutations';
import { resetClientSession } from '@/features/auth/lib/reset-client-session';
import { cn } from '@/lib/cn';

const buttonBase = 'inline-flex items-center justify-center rounded-lg border px-5 py-2.5 text-sm font-semibold transition-colors active:scale-[0.99]';

export default function HomeAuthButton() {
  const t = useTranslations('HomePage');
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery(sessionQueryOptions);
  const user = data?.user ?? null;

  const { mutate: handleSignOut, isPending: signOutLoading } = useMutation({
    mutationFn: signOut,
    onSuccess: () => {
      resetClientSession(queryClient);
      router.refresh();
    },
  });

  if (isLoading) return null;

  if (user) {
    return (
      <div className='mt-6'>
        <button
          type='button'
          className={cn(
            buttonBase,
            'border-destructive-button-border bg-destructive-button text-primary-foreground hover:bg-destructive-button-hover disabled:cursor-not-allowed disabled:opacity-80',
          )}
          onClick={() => handleSignOut()}
          disabled={signOutLoading}>
          {signOutLoading ? t('signingOut') : t('signOut')}
        </button>
      </div>
    );
  }

  return (
    <div className='mt-6'>
      <Link href='/auth' className={cn(buttonBase, 'border-primary bg-primary text-primary-foreground hover:border-primary-hover hover:bg-primary-hover')}>
        {t('signIn')}
      </Link>
    </div>
  );
}
