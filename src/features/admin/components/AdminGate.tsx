'use client';

import { useQuery } from '@tanstack/react-query';
import { sessionQueryOptions } from '@/features/auth/api/queries';
import AppShell from '@/common/components/AppShell';

type AdminGateProps = {
  children: React.ReactNode;
  forbiddenMessage: string;
};

export default function AdminGate({ children, forbiddenMessage }: AdminGateProps) {
  const { data, isPending } = useQuery(sessionQueryOptions);

  if (!data && isPending) {
    return (
      <AppShell>
        <div className='px-4 py-8 md:px-8'>
          <div className='h-6 w-40 animate-pulse rounded-sm bg-card-muted' />
        </div>
      </AppShell>
    );
  }

  if (!data?.user?.isAdmin) {
    return (
      <AppShell>
        <div className='px-4 py-8 md:px-8'>
          <p className='m-0 text-sm text-muted-foreground'>{forbiddenMessage}</p>
        </div>
      </AppShell>
    );
  }

  return children;
}
