import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { AppError } from '@/lib/errors';
import { handleApiError } from '@/lib/api-errors';

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.signOut({ scope: 'local' });
    if (error) throw new AppError('SIGN_OUT_ERROR', 500, 'SIGN_OUT_ERROR', { cause: error });

    return NextResponse.json(null);
  } catch (error) {
    return handleApiError(req, error);
  }
}
