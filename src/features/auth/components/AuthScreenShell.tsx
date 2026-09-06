'use client';

import type { ReactNode } from 'react';
import { useTranslations } from 'next-intl';

export default function AuthScreenShell({ children }: { children: ReactNode }) {
  const tApp = useTranslations('App');

  return (
    <div className='flex min-h-screen flex-col items-center justify-center bg-canvas px-4 py-10'>
      <p className='mb-10 text-sm font-medium text-muted-foreground'>{tApp('name')}</p>
      {children}
    </div>
  );
}
