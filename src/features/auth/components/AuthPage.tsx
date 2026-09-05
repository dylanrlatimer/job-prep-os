'use client';

import { useQuery } from '@tanstack/react-query';
import { sessionQueryOptions } from '@/features/auth/api/queries';
import AuthForm from './AuthForm';
import AuthScreenShell from './AuthScreenShell';

export default function AuthPage() {
  const { isLoading: sessionLoading } = useQuery(sessionQueryOptions);

  if (sessionLoading) return null;

  return (
    <AuthScreenShell>
      <AuthForm />
    </AuthScreenShell>
  );
}
