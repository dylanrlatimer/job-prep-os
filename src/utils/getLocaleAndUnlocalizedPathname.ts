import { routing } from '@/i18n/routing';

export function getLocaleAndUnlocalizedPathname(rawPathname: string) {
  const localeMatcher = new RegExp(`^/(${routing.locales.join('|')})(?=/|$)`);
  const match = rawPathname.match(localeMatcher);
  const locale = match?.[1] ?? routing.defaultLocale;

  const stripped = rawPathname.replace(localeMatcher, '');
  const pathname = stripped === '' ? '/' : stripped;

  return { locale, pathname };
}
