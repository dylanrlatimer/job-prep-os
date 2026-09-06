import 'server-only';

import { count } from 'drizzle-orm';
import { db } from '@/lib/drizzle/client';
import { exercisesInApp, theoryQuestionsInApp } from '@/lib/drizzle/schema';
import { DatabaseError } from '@/lib/errors';
import { getOptionalUser } from '@/lib/supabase/get-authenticated-user';
import { exerciseAccess } from '@/features/exercises/server/access';
import { questionAccess } from '@/features/theory/server/access';
import { listOffset, listPageMeta, PAGE_SIZE } from '@/common/lib/pagination';
import type { BrowseAllItem, BrowseListQuery, GetBrowseAllResponse } from '@/features/theory/browse/api/contracts';
import { hydrateBrowseQuestions, listBrowseQuestionIds, listPublicQuestionTopics } from '@/features/theory/browse/server/list-browse';
import { hydrateBrowseExercises, listBrowseExerciseIds, listPublicExerciseTopics } from '@/features/exercises/browse/server/list-browse';

type UnionRow = {
  type: 'question' | 'exercise';
  id: string;
  createdAt: string;
};

export async function listBrowseAll(query: BrowseListQuery): Promise<GetBrowseAllResponse> {
  const user = await getOptionalUser();

  try {
    const [questionUniverse, exerciseUniverse] = await Promise.all([
      db.select({ value: count() }).from(theoryQuestionsInApp).where(questionAccess.public()),
      db.select({ value: count() }).from(exercisesInApp).where(exerciseAccess.public()),
    ]);

    const unfilteredCount = Number(questionUniverse[0]?.value ?? 0) + Number(exerciseUniverse[0]?.value ?? 0);

    const [questionIds, exerciseIds, questionTopics, exerciseTopics] = await Promise.all([
      listBrowseQuestionIds(query, user?.id),
      listBrowseExerciseIds(query, user?.id),
      listPublicQuestionTopics(),
      listPublicExerciseTopics(),
    ]);

    const union: UnionRow[] = [
      ...questionIds.map((row) => ({ type: 'question' as const, id: row.id, createdAt: row.createdAt })),
      ...exerciseIds.map((row) => ({ type: 'exercise' as const, id: row.id, createdAt: row.createdAt })),
    ].sort((left, right) => right.createdAt.localeCompare(left.createdAt) || left.id.localeCompare(right.id));

    const totalCount = union.length;
    const topics = [...new Map([...questionTopics, ...exerciseTopics].map((topic) => [topic.id, topic])).values()].sort((left, right) =>
      left.name.localeCompare(right.name),
    );
    const meta = listPageMeta(query.page, totalCount, unfilteredCount);

    if (totalCount === 0) {
      return { items: [], topics, ...meta };
    }

    const pageRows = union.slice(listOffset(query.page), listOffset(query.page) + PAGE_SIZE);
    const pageQuestionIds = pageRows.filter((row) => row.type === 'question').map((row) => row.id);
    const pageExerciseIds = pageRows.filter((row) => row.type === 'exercise').map((row) => row.id);

    const [questions, exercises] = await Promise.all([hydrateBrowseQuestions(pageQuestionIds, user?.id), hydrateBrowseExercises(pageExerciseIds, user?.id)]);
    const questionsById = new Map(questions.map((item) => [item.id, item]));
    const exercisesById = new Map(exercises.map((item) => [item.id, item]));

    const items: BrowseAllItem[] = [];
    for (const row of pageRows) {
      if (row.type === 'question') {
        const item = questionsById.get(row.id);
        if (item) items.push({ type: 'question', item });
        continue;
      }

      const item = exercisesById.get(row.id);
      if (item) items.push({ type: 'exercise', item });
    }

    return { items, topics, ...meta };
  } catch (error) {
    throw new DatabaseError('DATABASE_ERROR', { cause: error });
  }
}
