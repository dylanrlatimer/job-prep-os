import 'server-only';

import { and, eq } from 'drizzle-orm';
import { db } from '@/lib/drizzle/client';
import { theoryLibraryItemsInApp } from '@/lib/drizzle/schema';
import { NotFoundError } from '@/lib/errors';

export async function assertQuestionInLibrary(profileId: string, questionId: string): Promise<void> {
  const [libraryItem] = await db
    .select({ questionId: theoryLibraryItemsInApp.questionId })
    .from(theoryLibraryItemsInApp)
    .where(and(eq(theoryLibraryItemsInApp.profileId, profileId), eq(theoryLibraryItemsInApp.questionId, questionId)))
    .limit(1);

  if (!libraryItem) {
    throw new NotFoundError('questionNotInRepository');
  }
}
