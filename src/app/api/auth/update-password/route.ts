import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { AppError, UnauthenticatedError } from '@/lib/errors';
import { handleApiError } from '@/lib/api-errors';
import { UpdatePasswordSchema } from '@/features/auth/api/contracts';

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json();
    const { password } = UpdatePasswordSchema.parse(body);

    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new UnauthenticatedError('UNAUTHENTICATED', { cause: authError });
    }

    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      throw new AppError('UPDATE_PASSWORD_FAILED', 422, 'UPDATE_PASSWORD_FAILED', { cause: updateError });
    }

    const { error: signOutError } = await supabase.auth.signOut({ scope: 'global' });

    if (signOutError) {
      console.error('[POST /api/auth/update-password] signOut error:', signOutError);
    }

    return NextResponse.json(null);
  } catch (error) {
    return handleApiError(req, error);
  }
}
