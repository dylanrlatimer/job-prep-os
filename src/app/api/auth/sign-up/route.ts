import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { AppError } from '@/lib/errors';
import { handleApiError } from '@/lib/api-errors';
import { SignUpSchema } from '@/features/auth/api/contracts';

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json();
    const { email, password } = SignUpSchema.parse(body);

    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.signUp({ email, password });

    if (error) throw new AppError('SIGN_UP_ERROR', 422, 'SIGN_UP_ERROR', { cause: error });

    return NextResponse.json(null);
  } catch (error) {
    return handleApiError(req, error);
  }
}
