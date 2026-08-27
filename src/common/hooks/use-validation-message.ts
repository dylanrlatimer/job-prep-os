'use client';

import { useTranslations } from 'next-intl';

export function useValidationMessage(error?: string): string | undefined {
  const t = useTranslations('Errors.validation');
  if (!error) return undefined;
  return t.has(error) ? t(error) : error;
}
