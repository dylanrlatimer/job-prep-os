'use client';

import { useState, type SubmitEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { updatePassword } from '@/features/auth/api/mutations';
import { resetClientSession } from '@/features/auth/lib/reset-client-session';
import { inputClassName, primaryButtonClassName } from '@/common/styles/form';
import { cn } from '@/lib/cn';

export function UpdatePasswordExpired() {
  const t = useTranslations('AuthPage');

  return (
    <div className='w-full max-w-sm'>
      <h1 className='m-0 text-lg font-medium text-foreground'>{t('updatePassword.expiredTitle')}</h1>
      <p className='mt-2 text-sm text-muted-foreground'>{t('updatePassword.expiredDescription')}</p>
      <p className='mt-6 text-sm'>
        <Link href='/auth/forgot-password' className='text-foreground no-underline hover:underline'>
          {t('updatePassword.requestNew')}
        </Link>
      </p>
    </div>
  );
}

export default function UpdatePasswordForm() {
  const t = useTranslations('AuthPage');
  const queryClient = useQueryClient();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [mismatchError, setMismatchError] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const { mutate, isPending } = useMutation({
    mutationFn: updatePassword,
    onSuccess: () => {
      resetClientSession(queryClient);
      setSubmitted(true);
    },
  });

  const handleSubmit = (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setMismatchError(true);
      return;
    }

    setMismatchError(false);
    mutate({ password });
  };

  if (submitted) {
    return (
      <div className='w-full max-w-sm'>
        <h1 className='m-0 text-lg font-medium text-foreground'>{t('updatePassword.successTitle')}</h1>
        <p className='mt-2 text-sm text-muted-foreground'>{t('updatePassword.successDescription')}</p>
        <Link href='/auth' className={cn(primaryButtonClassName, 'mt-6 w-full')}>
          {t('updatePassword.signIn')}
        </Link>
      </div>
    );
  }

  return (
    <div className='w-full max-w-sm'>
      <h1 className='m-0 text-lg font-medium text-foreground'>{t('updatePassword.title')}</h1>

      <form onSubmit={handleSubmit} className='mt-6'>
        <label className='mb-4 block'>
          <span className='mb-1.5 block text-xs text-secondary-foreground'>{t('updatePassword.newPassword')}</span>
          <input
            className={inputClassName}
            id='update-password-new'
            type='password'
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setMismatchError(false);
            }}
            required
            minLength={8}
            autoComplete='new-password'
          />
        </label>

        <label className='mb-5 block'>
          <span className='mb-1.5 block text-xs text-secondary-foreground'>{t('updatePassword.confirmPassword')}</span>
          <input
            className={inputClassName}
            id='update-password-confirm'
            type='password'
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              setMismatchError(false);
            }}
            required
            minLength={8}
            autoComplete='new-password'
          />
          {mismatchError && <p className='mt-2 text-sm text-destructive-bright'>{t('updatePassword.passwordMismatch')}</p>}
        </label>

        <button type='submit' className={cn(primaryButtonClassName, 'w-full')} disabled={isPending}>
          {t('updatePassword.submit')}
        </button>
      </form>
    </div>
  );
}
