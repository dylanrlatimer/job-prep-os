'use client';

import { BookOpen, Compass, Settings } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';
import LocaleSwitcher from '@/features/home/components/LocaleSwitcher';
import { cn } from '@/lib/cn';

type NavItem = {
  href: '/' | '/browse';
  label: string;
  icon: React.ReactNode;
  match: (pathname: string) => boolean;
};

export default function AppSidebar() {
  const t = useTranslations('AppSidebar');
  const pathname = usePathname();

  const navItems: NavItem[] = [
    {
      href: '/',
      label: t('theoryPractice'),
      icon: <BookOpen size={16} strokeWidth={1.75} aria-hidden='true' />,
      match: (path) => path === '/',
    },
    {
      href: '/browse',
      label: t('browseQuestions'),
      icon: <Compass size={16} strokeWidth={1.75} aria-hidden='true' />,
      match: (path) => path === '/browse' || path.startsWith('/browse/'),
    },
  ];

  return (
    <aside className='flex w-full shrink-0 flex-col border-b border-border bg-card md:w-56 md:border-b-0 md:border-r'>
      <div className='flex h-11 items-center border-b border-border px-4 md:h-auto md:py-4'>
        <Link href='/' className='text-sm font-medium tracking-tight text-foreground no-underline'>
          {t('appName')}
        </Link>
      </div>

      <nav className='flex flex-1 flex-col gap-1 p-2 md:px-3 md:py-4' aria-label={t('navigation')}>
        <p className='mb-1 hidden px-2 text-[11px] font-medium uppercase tracking-wide text-subtle-foreground md:block'>{t('workspace')}</p>

        <div className='flex gap-1 md:flex-col md:gap-0.5'>
          {navItems.map((item) => {
            const isActive = item.match(pathname);

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-label={item.label}
                className={cn(
                  'flex flex-1 items-center justify-center gap-2 rounded-sm px-2 py-2 text-sm no-underline transition-colors md:flex-none md:justify-start md:px-2.5',
                  isActive ? 'bg-card-muted text-foreground' : 'text-muted-foreground hover:bg-card-muted hover:text-foreground',
                )}
                aria-current={isActive ? 'page' : undefined}>
                {item.icon}
                <span className='hidden md:inline'>{item.label}</span>
              </Link>
            );
          })}

          <Link
            href='/settings'
            className={cn(
              'flex flex-1 items-center justify-center gap-2 rounded-sm px-2 py-2 text-sm no-underline transition-colors md:hidden',
              pathname === '/settings' ? 'bg-card-muted text-foreground' : 'text-muted-foreground hover:bg-card-muted hover:text-foreground',
            )}
            aria-label={t('settings')}
            aria-current={pathname === '/settings' ? 'page' : undefined}>
            <Settings size={16} strokeWidth={1.75} aria-hidden='true' />
          </Link>
        </div>
      </nav>

      <div className='hidden border-t border-border p-3 md:block'>
        <LocaleSwitcher className='mb-2 w-full' />
        <Link
          href='/settings'
          className={cn(
            'flex items-center gap-2 rounded-sm px-2.5 py-2 text-sm no-underline transition-colors',
            pathname === '/settings' ? 'bg-card-muted text-foreground' : 'text-muted-foreground hover:bg-card-muted hover:text-foreground',
          )}
          aria-current={pathname === '/settings' ? 'page' : undefined}>
          <Settings size={16} strokeWidth={1.75} aria-hidden='true' />
          {t('settings')}
        </Link>
      </div>
    </aside>
  );
}
