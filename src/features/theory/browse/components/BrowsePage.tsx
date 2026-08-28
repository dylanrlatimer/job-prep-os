'use client';

import AppShell from '@/common/components/AppShell';
import { useTranslations } from 'next-intl';

export default function BrowsePage() {
  const t = useTranslations('BrowsePage');

  return (
    <AppShell>
      <div className='px-4 py-8 md:px-8'>
        <h1 className='m-0 text-lg font-medium text-foreground'>{t('title')}</h1>
        <p className='mt-1 max-w-2xl text-sm text-muted-foreground'>{t('description')}</p>
      </div>
    </AppShell>
  );
}
