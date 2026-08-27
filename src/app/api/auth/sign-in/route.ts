import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { AppError } from '@/lib/errors';
import { handleApiError } from '@/lib/api-errors';
import { SignInSchema } from '@/features/auth/api/contracts';

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json();
    const { email, password } = SignInSchema.parse(body);

    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) throw new AppError('SIGN_IN_FAILED', 401, 'SIGN_IN_FAILED', { cause: error });

    return NextResponse.json(null);
  } catch (error) {
    return handleApiError(req, error);
  }
}
