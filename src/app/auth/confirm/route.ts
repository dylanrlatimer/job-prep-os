import { NextRequest, NextResponse } from 'next/server';
import type { EmailOtpType } from '@supabase/supabase-js';
import { createSupabaseServerClient } from '@/lib/supabase/server';

const ALLOWED_NEXT_PATHS = new Set(['/auth/update-password']);
const DEFAULT_NEXT = '/auth/update-password';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const token_hash = searchParams.get('token_hash');
    const type = searchParams.get('type') as EmailOtpType | null;
    const requestedNext = searchParams.get('next');
    const safeNext = requestedNext && ALLOWED_NEXT_PATHS.has(requestedNext) ? requestedNext : DEFAULT_NEXT;

    if (!token_hash || !type) {
      console.error('[Auth confirm] Missing token_hash or type');
      return NextResponse.redirect(new URL(DEFAULT_NEXT, req.url));
    }

    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });

    if (error) {
      console.error('[Auth confirm] verifyOtp error:', error);
      return NextResponse.redirect(new URL(DEFAULT_NEXT, req.url));
    }

    return NextResponse.redirect(new URL(safeNext, req.url));
  } catch (error) {
    console.error('[GET /auth/confirm] Error', error);
    return NextResponse.redirect(new URL(DEFAULT_NEXT, req.url));
  }
}
