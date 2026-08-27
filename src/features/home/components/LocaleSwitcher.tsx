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

export default function LocaleSwitcher() {
  const t = useTranslations('HomePage');
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const router = useRouter();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    router.replace(pathname, { locale: e.target.value as Locale });
  }

  return (
    <div className='relative mt-4 inline-block'>
      <select
        value={locale}
        onChange={handleChange}
        aria-label={t('selectLanguage')}
        className={cn(
          'cursor-pointer appearance-none rounded-lg border border-border bg-canvas py-2 pl-3 pr-8 text-sm font-medium text-foreground',
          'transition-colors hover:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20',
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
