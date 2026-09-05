import { NextRequest, NextResponse } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { updateSession } from './lib/supabase/updateSession';
import { routing } from './i18n/routing';
import { getLocaleAndUnlocalizedPathname } from '@/utils/getLocaleAndUnlocalizedPathname';

// NOTE: middleware() is deprecated in favor of proxy() in Next.js 16

// NOTE: Middleware will not run if path contains dot (e.g. '/users/john.smith') -> See next-intl docs if pertinent
export const config = {
  matcher: '/((?!api|trpc|_next|_vercel|auth/callback|auth/confirm|.*\\..*).*)',
};

// Public paths expressed in unlocalized form
const PUBLIC_PATHS = ['/auth', '/auth/callback', '/browse'];

function isPublicPath(unlocalizedPathname: string) {
  return PUBLIC_PATHS.some((p) => unlocalizedPathname === p || unlocalizedPathname.startsWith(`${p}/`));
}

function redirectPreservingCookies(request: NextRequest, baseResponse: NextResponse, targetPathname: string) {
  const url = request.nextUrl.clone();
  url.pathname = targetPathname;

  const redirectResponse = NextResponse.redirect(url);

  // Preserve any cookies that Supabase or next-intl set on the base response
  for (const c of baseResponse.cookies.getAll()) {
    redirectResponse.cookies.set(c);
  }

  return redirectResponse;
}

const handleI18nRouting = createMiddleware(routing);

export default async function proxy(request: NextRequest) {
  // 1) Let next-intl decide routing (may be redirect/next/rewrite)
  const response = handleI18nRouting(request);

  // 2) Ensure Supabase refresh writes cookies onto THAT SAME response
  const { user } = await updateSession(request, response);

  // 3) Apply  gating logic in “unlocalized space”
  const rawPathname = request.nextUrl.pathname;
  const { locale, pathname } = getLocaleAndUnlocalizedPathname(rawPathname);

  if (!user && !isPublicPath(pathname)) {
    return redirectPreservingCookies(request, response, `/${locale}/browse`);
  }

  if (user && pathname === '/auth') {
    return redirectPreservingCookies(request, response, `/${locale}`);
  }

  return response;
}
