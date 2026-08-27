import 'server-only';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { SessionResponse } from '@/features/auth/api/contracts';

export async function getSession(): Promise<SessionResponse> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return { user: null };
  return { user: { id: user.id, email: user.email ?? null } };
}
