import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['en', 'fr'],
  defaultLocale: 'en',
  localeCookie: {
    maxAge: 60 * 60 * 24 * 365,
  },
});
