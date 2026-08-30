import 'server-only';

import { and, eq, isNull } from 'drizzle-orm';
import { db } from '@/lib/drizzle/client';
import { theoryLibraryItemsInApp, theoryQuestionsInApp } from '@/lib/drizzle/schema';
import { ForbiddenError, NotFoundError } from '@/lib/errors';

export const questionAccess = {
  public: () => eq(theoryQuestionsInApp.isPublic, true),
  ownedBy: (userId: string) => eq(theoryQuestionsInApp.ownerProfileId, userId),
  appOwned: () => isNull(theoryQuestionsInApp.ownerProfileId),
};

export function isQuestionOwnedBy(userId: string, ownerProfileId: string | null): boolean {
  return ownerProfileId === userId;
}

export function isQuestionAppOwned(ownerProfileId: string | null): boolean {
  return ownerProfileId === null;
}

export function assertQuestionOwnedBy(userId: string, question: { ownerProfileId: string | null } | undefined): asserts question is { ownerProfileId: string } {
  if (!question) {
    throw new NotFoundError('questionNotFound');
  }

  if (!isQuestionOwnedBy(userId, question.ownerProfileId)) {
    throw new ForbiddenError('questionForbidden');
  }
}

export function assertQuestionAppOwned(question: { ownerProfileId: string | null } | undefined): void {
  if (!question || !isQuestionAppOwned(question.ownerProfileId)) {
    throw new NotFoundError('questionNotFound');
  }
}

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

export function assertQuestionCanUnsave(userId: string, ownerProfileId: string | null): void {
  if (isQuestionOwnedBy(userId, ownerProfileId)) {
    throw new ForbiddenError('cannotUnsaveOwnedQuestion');
  }
}
