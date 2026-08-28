import 'server-only';

import { eq } from 'drizzle-orm';
import { getAuthenticatedUser } from '@/lib/supabase/get-authenticated-user';
import { db } from '@/lib/drizzle/client';
import { profilesInApp } from '@/lib/drizzle/schema';
import { NotFoundError } from '@/lib/errors';
import type { SettingsResponse, UpdateDisplayNameInput } from '@/features/settings/api/contracts';

export async function updateDisplayName(input: UpdateDisplayNameInput): Promise<SettingsResponse> {
  const user = await getAuthenticatedUser();

  const displayName = input.displayName.length > 0 ? input.displayName : null;

  const [updated] = await db
    .update(profilesInApp)
    .set({ displayName })
    .where(eq(profilesInApp.id, user.id))
    .returning({ displayName: profilesInApp.displayName });

  if (!updated) {
    throw new NotFoundError('profileNotFound');
  }

  return {
    email: user.email ?? null,
    displayName: updated.displayName,
  };
}
