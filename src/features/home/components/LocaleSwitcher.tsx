'use client';

import { useMemo } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';
import Select from '@/common/components/Select';

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

  const options = useMemo(
    () =>
      routing.locales.map((value) => ({
        value,
        label: LOCALE_LABELS[value],
      })),
    [],
  );

  return (
    <Select
      className={className}
      placement='top'
      aria-label={t('selectLanguage')}
      value={locale}
      onValueChange={(value) => router.replace(pathname, { locale: value as Locale })}
      options={options}
    />
  );
}
