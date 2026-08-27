import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { searchParams } = new URL(req.url);

    const code = searchParams.get('code');
    if (!code) {
      console.error('[OAuth callback] Missing code');
      return NextResponse.redirect(new URL('/auth?error=oauth_failed', req.url));
    }

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error('[OAuth callback] Exchange error:', error);
      return NextResponse.redirect(new URL('/auth?error=oauth_failed', req.url));
    }

    return NextResponse.redirect(new URL('/', req.url));
  } catch (error) {
    console.error('[GET /api/auth/callback] Error', error);
    return NextResponse.redirect(new URL('/auth?error=oauth_failed', req.url));
  }
}
