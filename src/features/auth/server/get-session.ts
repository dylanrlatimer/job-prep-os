import 'server-only';

import { eq } from 'drizzle-orm';
import { db } from '@/lib/drizzle/client';
import { profilesInApp } from '@/lib/drizzle/schema';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { SessionResponse } from '@/features/auth/api/contracts';

export async function getSession(): Promise<SessionResponse> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return { user: null };

  const [profile] = await db.select({ isAdmin: profilesInApp.isAdmin }).from(profilesInApp).where(eq(profilesInApp.id, user.id)).limit(1);

  return {
    user: {
      id: user.id,
      email: user.email ?? null,
      isAdmin: profile?.isAdmin ?? false,
    },
  };
}
