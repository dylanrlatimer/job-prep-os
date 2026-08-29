import 'server-only';

import { eq } from 'drizzle-orm';
import { db } from '@/lib/drizzle/client';
import { profilesInApp } from '@/lib/drizzle/schema';
import { NotFoundError } from '@/lib/errors';
import { getAuthenticatedUser } from '@/lib/supabase/get-authenticated-user';

export async function getAuthenticatedProfile() {
  const user = await getAuthenticatedUser();

  const [profile] = await db.select({ isAdmin: profilesInApp.isAdmin }).from(profilesInApp).where(eq(profilesInApp.id, user.id)).limit(1);

  if (!profile) {
    throw new NotFoundError('profileNotFound');
  }

  return { user, isAdmin: profile.isAdmin };
}
