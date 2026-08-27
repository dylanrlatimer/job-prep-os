'use client';

import { FormEvent, useMemo, useState } from 'react';
import OAuthIcon from '@/common/icons/OAuthIcon';
import { useAuthForm } from '../hooks/useAuthForm';
import { supabase } from '@/lib/supabase/client';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/cn';

// TODO: Add TOS & Privacy Policy if applicable

type AuthMode = 'login' | 'register';

const inputClassName =
  'box-border w-full rounded-lg border border-input bg-card px-3.5 py-2.5 text-base text-foreground transition-[border-color,box-shadow] placeholder:text-subtle-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20';

export default function AuthPage() {
  const t = useTranslations('AuthPage');

  const [mode, setMode] = useState<AuthMode>('login');
  const isSignUp = mode === 'register';

  const [email, setEmail] = useState('');
  const [username, setUsername] = useState(''); // kept for your submit() payload
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

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    await submit({
      email,
      password,
      username: isSignUp ? username : undefined,
    });
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
    setUsername('');
    setPassword('');
  };

  if (sessionLoading) return null;

  return (
    <div className='grid min-h-screen place-items-center bg-canvas px-4'>
      <section className='w-full max-w-md overflow-hidden rounded-lg border border-border bg-card shadow-card sm:max-w-[420px]'>
        <header className='border-b border-border bg-card px-4 pb-4 pt-5 sm:px-6 sm:pt-6'>
          <h1 className='m-0 text-xl font-extrabold tracking-wide text-primary sm:text-2xl md:text-[1.75rem]'>{copy.title}</h1>
          <p className='mb-4 mt-1.5 text-sm text-secondary-foreground sm:text-base'>{copy.subtitle}</p>

          <div className='mt-1 grid grid-cols-2 gap-1 rounded-lg border border-tab-border bg-tab-track p-1' role='tablist' aria-label={t('authMode')}>
            <button
              role='tab'
              aria-selected={!isSignUp}
              type='button'
              className={cn(
                'cursor-pointer appearance-none rounded-md border-0 px-3 py-2 text-sm font-bold transition-colors sm:text-base',
                !isSignUp ? 'bg-primary text-primary-foreground' : 'bg-transparent text-secondary-foreground hover:bg-tab-hover hover:text-foreground',
              )}
              onClick={() => handleToggle('login')}>
              {t('loginTab')}
            </button>

            <button
              role='tab'
              aria-selected={isSignUp}
              type='button'
              className={cn(
                'cursor-pointer appearance-none rounded-md border-0 px-3 py-2 text-sm font-bold transition-colors sm:text-base',
                isSignUp ? 'bg-primary text-primary-foreground' : 'bg-transparent text-secondary-foreground hover:bg-tab-hover hover:text-foreground',
              )}
              onClick={() => handleToggle('register')}>
              {t('registerTab')}
            </button>
          </div>
        </header>

        <div className='px-4 pt-4 sm:px-6'>
          <button
            type='button'
            className='flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-border bg-card px-3.5 py-2.5 text-sm font-bold text-foreground transition-colors hover:border-input hover:bg-muted active:scale-[0.99] sm:text-base'
            aria-label={copy.google}
            onClick={handleGoogleSignIn}>
            <OAuthIcon className='inline-flex shrink-0' />
            <span>{copy.google}</span>
          </button>

          <div className='my-4 mb-3 grid grid-cols-[1fr_auto_1fr] items-center gap-3'>
            <span className='h-px bg-border' />
            <span className='text-xs text-divider-foreground sm:text-sm'>{t('or')}</span>
            <span className='h-px bg-border' />
          </div>
        </div>

        <form onSubmit={handleSubmit} className='px-4 pb-6 pt-4 sm:px-6'>
          <label className='mb-4 block'>
            <span className='mb-1.5 block text-sm font-bold text-strong-foreground'>{t('emailLabel')}</span>
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

          <label className='mb-4 block'>
            <span className='mb-1.5 block text-sm font-bold text-strong-foreground'>{t('passwordLabel')}</span>
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
            className='mt-1 w-full cursor-pointer rounded-lg border border-primary bg-primary px-3.5 py-2.5 text-sm font-bold text-primary-foreground transition-colors hover:border-primary-hover hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70 active:scale-[0.99] sm:text-base'
            disabled={loading}>
            {copy.submit}
          </button>

          {isSignUp && (
            <p className='mt-4 text-center text-xs leading-snug text-secondary-foreground sm:text-sm [&_a]:text-primary [&_a]:no-underline hover:[&_a]:underline'>
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
      </section>
    </div>
  );
}
