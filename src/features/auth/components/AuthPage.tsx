'use client';

import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { sessionQueryOptions } from '@/features/auth/api/queries';
import AuthForm from './AuthForm';

export default function AuthPage() {
  const tApp = useTranslations('App');
  const { isLoading: sessionLoading } = useQuery(sessionQueryOptions);

  if (sessionLoading) return null;

  return (
    <div className='flex min-h-screen flex-col items-center justify-center bg-canvas px-4 py-10'>
      <p className='mb-10 text-sm font-medium text-muted-foreground'>{tApp('name')}</p>
      <AuthForm />
    </div>
  );
}
