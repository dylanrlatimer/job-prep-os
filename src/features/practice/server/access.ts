import 'server-only';

import { eq } from 'drizzle-orm';
import { practiceSessionsInApp } from '@/lib/drizzle/schema';
import { ForbiddenError, NotFoundError } from '@/lib/errors';

export const sessionAccess = {
  ownedBy: (userId: string) => eq(practiceSessionsInApp.profileId, userId),
};

export function assertSessionOwnedBy(userId: string, session: { profileId: string } | undefined): asserts session is { profileId: string } {
  if (!session) {
    throw new NotFoundError('sessionNotFound');
  }

  if (session.profileId !== userId) {
    throw new ForbiddenError('sessionForbidden');
  }
}
