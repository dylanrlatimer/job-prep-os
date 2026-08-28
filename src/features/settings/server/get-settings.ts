import 'server-only';

import { eq } from 'drizzle-orm';
import { getAuthenticatedUser } from '@/lib/supabase/get-authenticated-user';
import { db } from '@/lib/drizzle/client';
import { profilesInApp } from '@/lib/drizzle/schema';
import { NotFoundError } from '@/lib/errors';
import type { SettingsResponse } from '@/features/settings/api/contracts';

export async function getSettings(): Promise<SettingsResponse> {
  const user = await getAuthenticatedUser();

  const [profile] = await db.select({ displayName: profilesInApp.displayName }).from(profilesInApp).where(eq(profilesInApp.id, user.id)).limit(1);

  if (!profile) {
    throw new NotFoundError('profileNotFound');
  }

  return {
    email: user.email ?? null,
    displayName: profile.displayName,
  };
}
