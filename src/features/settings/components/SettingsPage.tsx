'use client';

import { useEffect, useState, type SubmitEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import AppShell from '@/common/components/AppShell';
import SettingsPageSkeleton from './SettingsPageSkeleton';
import { Link, useRouter } from '@/i18n/navigation';
import { signOut } from '@/features/auth/api/mutations';
import { resetClientSession } from '@/features/auth/lib/reset-client-session';
import { settingsQueryOptions } from '@/features/settings/api/queries';
import { updateSettings } from '@/features/settings/api/mutations';
import { practiceKeys } from '@/features/practice/api/query-keys';
import { useToastStore } from '@/lib/store/use-toast-store';
import { settingsKeys } from '@/features/settings/api/query-keys';
import {
  destructiveSolidButtonClassName,
  inputClassName,
  primaryButtonClassName,
  readOnlyInputClassName,
  secondaryButtonClassName,
} from '@/common/styles/form';
import { cn } from '@/lib/cn';

export default function SettingsPage() {
  const t = useTranslations('SettingsPage');
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data, isPending } = useQuery(settingsQueryOptions);
  const [displayName, setDisplayName] = useState('');
  const [exerciseRatio, setExerciseRatio] = useState(60);

  useEffect(() => {
    if (data) {
      setDisplayName(data.displayName ?? '');
      setExerciseRatio(data.exerciseRatio);
    }
  }, [data]);

  const { mutate: saveSettings, isPending: isSaving } = useMutation({
    mutationFn: updateSettings,
    onSuccess: (response) => {
      queryClient.setQueryData(settingsKeys.detail(), response);
      void queryClient.invalidateQueries({ queryKey: practiceKeys.setup() });
      useToastStore.getState().addToast(t('saveSuccess'), 'success');
    },
  });

  const { mutate: handleSignOut, isPending: isSigningOut } = useMutation({
    mutationFn: signOut,
    onSuccess: () => {
      resetClientSession(queryClient);
      router.replace('/browse');
    },
  });

  const handleSubmit = (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    saveSettings({ displayName, exerciseRatio });
  };

  if (!data && isPending) {
    return (
      <AppShell>
        <SettingsPageSkeleton />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className='mx-auto w-full max-w-sm px-4 py-8'>
        <h1 className='m-0 text-lg font-medium text-foreground'>{t('title')}</h1>

        <form onSubmit={handleSubmit} className='mt-6'>
          <label className='mb-4 block'>
            <span className='mb-1.5 block text-xs text-secondary-foreground'>{t('displayNameLabel')}</span>
            <input
              className={inputClassName}
              type='text'
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              autoComplete='name'
              maxLength={100}
            />
          </label>

          <label className='mb-4 block'>
            <span className='mb-1.5 block text-xs text-secondary-foreground'>{t('emailLabel')}</span>
            <input className={readOnlyInputClassName} type='email' value={data?.email ?? ''} readOnly tabIndex={-1} aria-readonly='true' />
          </label>

          <label className='mb-6 block'>
            <span className='mb-1.5 block text-xs text-secondary-foreground'>{t('exerciseRatioLabel')}</span>
            <input
              className={inputClassName}
              type='number'
              min={0}
              max={100}
              step={1}
              value={exerciseRatio}
              onChange={(e) => {
                const next = Number(e.target.value);
                if (!Number.isFinite(next)) {
                  return;
                }
                setExerciseRatio(Math.min(100, Math.max(0, Math.round(next))));
              }}
            />
            <span className='mt-1.5 block text-xs text-muted-foreground'>{t('exerciseRatioHint', { questions: 100 - exerciseRatio })}</span>
          </label>

          <button type='submit' className={cn(primaryButtonClassName, 'w-full')} disabled={isSaving}>
            {isSaving ? t('saving') : t('save')}
          </button>
        </form>

        <div className='mt-8 flex flex-col gap-3 border-t border-border pt-6'>
          <Link href='/auth/update-password' className={cn(secondaryButtonClassName, 'w-full')}>
            {t('changePassword')}
          </Link>
          <button type='button' className={cn(destructiveSolidButtonClassName, 'w-full')} onClick={() => handleSignOut()} disabled={isSigningOut}>
            {isSigningOut ? t('signingOut') : t('signOut')}
          </button>
        </div>
      </div>
    </AppShell>
  );
}
