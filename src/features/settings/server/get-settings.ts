import 'server-only';

import { eq } from 'drizzle-orm';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { db } from '@/lib/drizzle/client';
import { profilesInApp } from '@/lib/drizzle/schema';
import { NotFoundError, UnauthenticatedError } from '@/lib/errors';
import type { SettingsResponse } from '@/features/settings/api/contracts';

export async function getSettings(): Promise<SettingsResponse> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new UnauthenticatedError('UNAUTHENTICATED', { cause: authError });
  }

  const [profile] = await db.select({ displayName: profilesInApp.displayName }).from(profilesInApp).where(eq(profilesInApp.id, user.id)).limit(1);

  if (!profile) {
    throw new NotFoundError('profileNotFound');
  }

  return {
    email: user.email ?? null,
    displayName: profile.displayName,
  };
}
