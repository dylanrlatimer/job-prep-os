import 'server-only';

import { ForbiddenError } from '@/lib/errors';
import { getAuthenticatedProfile } from './get-authenticated-profile';

export async function assertAdmin() {
  const { user, isAdmin } = await getAuthenticatedProfile();

  if (!isAdmin) {
    throw new ForbiddenError('adminForbidden');
  }

  return user;
}
