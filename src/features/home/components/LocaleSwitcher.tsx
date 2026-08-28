'use client';

import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';
import { cn } from '@/lib/cn';

type Locale = (typeof routing.locales)[number];

const LOCALE_LABELS: Record<Locale, string> = {
  en: 'English',
  fr: 'Français',
};

type LocaleSwitcherProps = {
  className?: string;
};

export default function LocaleSwitcher({ className }: LocaleSwitcherProps) {
  const t = useTranslations('AppSidebar');
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const router = useRouter();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    router.replace(pathname, { locale: e.target.value as Locale });
  }

  return (
    <div className={cn('relative inline-block', className)}>
      <select
        value={locale}
        onChange={handleChange}
        aria-label={t('selectLanguage')}
        className={cn(
          'box-border w-full cursor-pointer appearance-none rounded-sm border border-input bg-card py-2 pl-3 pr-8 text-sm text-foreground',
          'transition-colors hover:border-tertiary-foreground focus:border-tertiary-foreground focus:outline-none',
        )}>
        {routing.locales.map((l) => (
          <option key={l} value={l}>
            {LOCALE_LABELS[l]}
          </option>
        ))}
      </select>
      <svg
        className='pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground'
        width='12'
        height='12'
        viewBox='0 0 12 12'
        fill='none'
        aria-hidden='true'>
        <path d='M2.5 4.5L6 8L9.5 4.5' stroke='currentColor' strokeWidth='1.5' strokeLinecap='round' strokeLinejoin='round' />
      </svg>
    </div>
  );
}
