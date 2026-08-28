import 'server-only';

import { eq } from 'drizzle-orm';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { db } from '@/lib/drizzle/client';
import { profilesInApp } from '@/lib/drizzle/schema';
import { NotFoundError, UnauthenticatedError } from '@/lib/errors';
import type { SettingsResponse, UpdateDisplayNameInput } from '@/features/settings/api/contracts';

export async function updateDisplayName(input: UpdateDisplayNameInput): Promise<SettingsResponse> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new UnauthenticatedError('UNAUTHENTICATED', { cause: authError });
  }

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
