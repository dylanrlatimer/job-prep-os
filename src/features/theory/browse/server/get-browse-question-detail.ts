import 'server-only';

import { and, eq } from 'drizzle-orm';
import { db } from '@/lib/drizzle/client';
import { topicsInApp, theoryLibraryItemsInApp, theoryQuestionTopicsInApp, theoryQuestionsInApp } from '@/lib/drizzle/schema';
import { DatabaseError, NotFoundError } from '@/lib/errors';
import { getAuthenticatedUser } from '@/lib/supabase/get-authenticated-user';
import { isQuestionAppOwned, questionAccess } from '@/features/theory/server/access';
import type { BrowseQuestionDetailResponse } from '@/features/theory/browse/api/contracts';
import type { RepositoryTopic } from '@/features/theory/repository/api/contracts';
import { parseTiptapDocument } from '@/lib/tiptap/parse-document';

export async function getBrowseQuestionDetail(questionId: string): Promise<BrowseQuestionDetailResponse> {
  const user = await getAuthenticatedUser();

  try {
    const [question] = await db
      .select({
        id: theoryQuestionsInApp.id,
        ownerProfileId: theoryQuestionsInApp.ownerProfileId,
        question: theoryQuestionsInApp.question,
        answer: theoryQuestionsInApp.answer,
        sourceName: theoryQuestionsInApp.sourceName,
        sourceUrl: theoryQuestionsInApp.sourceUrl,
      })
      .from(theoryQuestionsInApp)
      .where(and(eq(theoryQuestionsInApp.id, questionId), questionAccess.public()))
      .limit(1);

    if (!question) {
      throw new NotFoundError('questionNotFound');
    }

    const topicRows = await db
      .select({
        id: topicsInApp.id,
        name: topicsInApp.name,
        slug: topicsInApp.slug,
      })
      .from(theoryQuestionTopicsInApp)
      .innerJoin(topicsInApp, eq(theoryQuestionTopicsInApp.topicId, topicsInApp.id))
      .where(eq(theoryQuestionTopicsInApp.questionId, questionId));

    const topics: RepositoryTopic[] = topicRows.map((row) => ({ id: row.id, name: row.name, slug: row.slug })).sort((a, b) => a.name.localeCompare(b.name));

    const [savedRow] = await db
      .select({ questionId: theoryLibraryItemsInApp.questionId })
      .from(theoryLibraryItemsInApp)
      .where(and(eq(theoryLibraryItemsInApp.profileId, user.id), eq(theoryLibraryItemsInApp.questionId, questionId)))
      .limit(1);

    return {
      id: question.id,
      question: question.question,
      answer: parseTiptapDocument(question.answer),
      topics,
      sourceName: question.sourceName,
      sourceUrl: question.sourceUrl,
      isSaved: !!savedRow,
      isSystem: isQuestionAppOwned(question.ownerProfileId),
    };
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw error;
    }
    throw new DatabaseError('DATABASE_ERROR', { cause: error });
  }
}
