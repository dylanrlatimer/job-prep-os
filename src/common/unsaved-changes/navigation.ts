import { getLocaleAndUnlocalizedPathname } from '@/utils/getLocaleAndUnlocalizedPathname';

export function isModifiedClick(event: MouseEvent) {
  return event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0;
}

const EXTERNAL_PROTOCOLS = new Set(['mailto:', 'tel:', 'javascript:']);

export function resolveInternalNavigationHref(anchor: HTMLAnchorElement): string | null {
  if (anchor.target === '_blank' || anchor.hasAttribute('download')) return null;

  const rawHref = anchor.getAttribute('href');
  if (!rawHref || rawHref.startsWith('#') || EXTERNAL_PROTOCOLS.has(rawHref)) return null;

  const url = new URL(rawHref, window.location.href);
  if (url.origin !== window.location.origin) return null;

  return `${url.pathname}${url.search}${url.hash}`;
}

export function isSameNavigationTarget(currentHref: string, nextHref: string) {
  const currentUrl = new URL(currentHref, window.location.origin);
  const nextUrl = new URL(nextHref, window.location.origin);

  const currentPath = getLocaleAndUnlocalizedPathname(currentUrl.pathname).pathname;
  const nextPath = getLocaleAndUnlocalizedPathname(nextUrl.pathname).pathname;

  return currentPath === nextPath && currentUrl.search === nextUrl.search && currentUrl.hash === nextUrl.hash;
}
