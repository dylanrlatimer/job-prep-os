'use client';

import { Settings } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

export default function AppHeader() {
  const t = useTranslations('App');

  return (
    <header className='flex h-11 shrink-0 items-center justify-between border-b border-border px-4'>
      <Link href='/' className='text-sm font-medium tracking-tight text-foreground no-underline'>
        {t('name')}
      </Link>
      <Link
        href='/settings'
        aria-label={t('settings')}
        className='flex size-8 items-center justify-center rounded-sm text-muted-foreground no-underline transition-colors hover:bg-card-muted hover:text-foreground'>
        <Settings size={17} strokeWidth={1.75} aria-hidden='true' />
      </Link>
    </header>
  );
}
