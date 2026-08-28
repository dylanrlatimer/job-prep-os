import 'server-only';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { UnauthenticatedError } from '@/lib/errors';

export async function getAuthenticatedUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new UnauthenticatedError('UNAUTHENTICATED', { cause: authError });
  }

  return user;
}
