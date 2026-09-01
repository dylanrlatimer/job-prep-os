import 'server-only';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { UnauthenticatedError } from '@/lib/errors';

export async function getOptionalUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return null;
  }

  return user;
}

export async function getAuthenticatedUser() {
  const user = await getOptionalUser();

  if (!user) {
    throw new UnauthenticatedError('UNAUTHENTICATED');
  }

  return user;
}
