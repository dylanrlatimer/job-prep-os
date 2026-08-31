'use client';

import AppShell from '@/common/components/AppShell';
import { secondaryButtonClassName } from '@/common/styles/form';
import { cn } from '@/lib/cn';

type PageLoadErrorProps = {
  title: string;
  message: string;
  onRetry: () => void;
  isRetrying?: boolean;
  retryLabel: string;
  retryingLabel?: string;
};

export default function PageLoadError({ title, message, onRetry, isRetrying, retryLabel, retryingLabel }: PageLoadErrorProps) {
  return (
    <AppShell>
      <div className='px-4 py-8 md:px-8'>
        <h1 className='m-0 text-lg font-medium text-foreground'>{title}</h1>
        <p className='mt-2 text-sm text-muted-foreground'>{message}</p>
        <button type='button' className={cn(secondaryButtonClassName, 'mt-4')} onClick={onRetry} disabled={isRetrying}>
          {isRetrying && retryingLabel ? retryingLabel : retryLabel}
        </button>
      </div>
    </AppShell>
  );
}
