'use client';

import { useMemo, useState, type SubmitEvent } from 'react';
import OAuthIcon from '@/common/icons/OAuthIcon';
import { useAuthForm } from '../hooks/useAuthForm';
import { supabase } from '@/lib/supabase/client';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/cn';

// TODO: Add TOS & Privacy Policy if applicable

type AuthMode = 'login' | 'register';

const inputClassName =
  'box-border w-full rounded-sm border border-input bg-card px-3 py-2 text-sm text-foreground placeholder:text-subtle-foreground focus:border-tertiary-foreground focus:outline-none';

export default function AuthPage() {
  const t = useTranslations('AuthPage');
  const tApp = useTranslations('App');

  const [mode, setMode] = useState<AuthMode>('login');
  const isSignUp = mode === 'register';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const { loading, submit, sessionLoading } = useAuthForm(isSignUp);

  const copy = useMemo(() => {
    const key: AuthMode = isSignUp ? 'register' : 'login';

    return {
      title: t(`${key}.title`),
      subtitle: t(`${key}.subtitle`),
      submit: t(`${key}.submit`),
      google: t(`${key}.google`),
      passwordPlaceholder: t(`${key}.passwordPlaceholder`),
    };
  }, [isSignUp, t]);

  const handleSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    submit({ email, password });
  };

  const handleGoogleSignIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  const handleToggle = (nextMode: AuthMode) => {
    setMode(nextMode);
    setEmail('');
    setPassword('');
  };

  if (sessionLoading) return null;

  return (
    <div className='flex min-h-screen flex-col items-center justify-center bg-canvas px-4 py-10'>
      <p className='mb-10 text-sm font-medium text-muted-foreground'>{tApp('name')}</p>

      <div className='w-full max-w-sm'>
        <h1 className='m-0 text-lg font-medium text-foreground'>{copy.title}</h1>
        <p className='mt-1 text-sm text-muted-foreground'>{copy.subtitle}</p>

        <div className='mt-6 flex gap-4 border-b border-border' role='tablist' aria-label={t('authMode')}>
          <button
            role='tab'
            aria-selected={!isSignUp}
            type='button'
            className={cn(
              '-mb-px cursor-pointer border-0 bg-transparent px-0 pb-2 text-sm transition-colors',
              !isSignUp ? 'border-b border-foreground text-foreground' : 'border-b border-transparent text-muted-foreground hover:text-foreground',
            )}
            onClick={() => handleToggle('login')}>
            {t('loginTab')}
          </button>
          <button
            role='tab'
            aria-selected={isSignUp}
            type='button'
            className={cn(
              '-mb-px cursor-pointer border-0 bg-transparent px-0 pb-2 text-sm transition-colors',
              isSignUp ? 'border-b border-foreground text-foreground' : 'border-b border-transparent text-muted-foreground hover:text-foreground',
            )}
            onClick={() => handleToggle('register')}>
            {t('registerTab')}
          </button>
        </div>

        <div className='mt-6'>
          <button
            type='button'
            className='flex w-full cursor-pointer items-center justify-center gap-2 rounded-sm border border-border bg-card px-3 py-2 text-sm text-foreground transition-colors hover:bg-card-muted'
            aria-label={copy.google}
            onClick={handleGoogleSignIn}>
            <OAuthIcon className='inline-flex shrink-0' />
            <span>{copy.google}</span>
          </button>

          <div className='my-5 flex items-center gap-3'>
            <span className='h-px flex-1 bg-border' />
            <span className='text-xs text-divider-foreground'>{t('or')}</span>
            <span className='h-px flex-1 bg-border' />
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <label className='mb-4 block'>
            <span className='mb-1.5 block text-xs text-secondary-foreground'>{t('emailLabel')}</span>
            <input
              className={inputClassName}
              type='email'
              placeholder={t('emailPlaceholder')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete='email'
            />
          </label>

          <label className='mb-5 block'>
            <span className='mb-1.5 block text-xs text-secondary-foreground'>{t('passwordLabel')}</span>
            <input
              className={inputClassName}
              type='password'
              placeholder={copy.passwordPlaceholder}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete={isSignUp ? 'new-password' : 'current-password'}
            />
          </label>

          <button
            type='submit'
            className='w-full cursor-pointer rounded-sm border border-primary bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60'
            disabled={loading}>
            {copy.submit}
          </button>

          {isSignUp && (
            <p className='mt-4 text-center text-xs leading-relaxed text-muted-foreground [&_a]:text-foreground [&_a]:no-underline hover:[&_a]:underline'>
              {t.rich('register.tosNote', {
                tos: (chunks) => (
                  <a href='/terms-of-service' target='_blank' rel='noopener noreferrer'>
                    {chunks}
                  </a>
                ),
                privacy: (chunks) => (
                  <a href='/privacy-policy' target='_blank' rel='noopener noreferrer'>
                    {chunks}
                  </a>
                ),
              })}
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
