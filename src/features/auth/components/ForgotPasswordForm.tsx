'use client';

import { useState, type SubmitEvent } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { forgotPassword } from '@/features/auth/api/mutations';
import { inputClassName, primaryButtonClassName } from '@/common/styles/form';
import { cn } from '@/lib/cn';

export default function ForgotPasswordForm() {
  const t = useTranslations('AuthPage');

  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const { mutate, isPending } = useMutation({
    mutationFn: forgotPassword,
    onSuccess: () => setSubmitted(true),
  });

  const handleSubmit = (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    mutate({ email: email.trim() });
  };

  if (submitted) {
    return (
      <div className='w-full max-w-sm'>
        <h1 className='m-0 text-lg font-medium text-foreground'>{t('forgotPassword.successTitle')}</h1>
        <p className='mt-2 text-sm text-muted-foreground'>{t('forgotPassword.successDescription')}</p>
        <p className='mt-6 text-sm'>
          <Link href='/auth' className='text-foreground no-underline hover:underline'>
            {t('forgotPassword.backToLogin')}
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className='w-full max-w-sm'>
      <h1 className='m-0 text-lg font-medium text-foreground'>{t('forgotPassword.title')}</h1>
      <p className='mt-1 text-sm text-muted-foreground'>{t('forgotPassword.description')}</p>

      <form onSubmit={handleSubmit} className='mt-6'>
        <label className='mb-5 block'>
          <span className='mb-1.5 block text-xs text-secondary-foreground'>{t('emailLabel')}</span>
          <input
            className={inputClassName}
            id='forgot-password-email'
            type='email'
            placeholder={t('emailPlaceholder')}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete='email'
          />
        </label>

        <button type='submit' className={cn(primaryButtonClassName, 'w-full')} disabled={isPending}>
          {t('forgotPassword.submit')}
        </button>
      </form>

      <p className='mt-6 text-sm'>
        <Link href='/auth' className='text-foreground no-underline hover:underline'>
          {t('forgotPassword.backToLogin')}
        </Link>
      </p>
    </div>
  );
}
