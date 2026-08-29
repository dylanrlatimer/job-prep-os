import type { JSONContent } from '@tiptap/core';

export type QuestionFormValues = {
  question: string;
  answer: JSONContent | null;
  categoryIds: string[];
  sourceName: string;
  sourceUrl: string;
  isPublic: boolean;
};

export const emptyQuestionFormValues: QuestionFormValues = {
  question: '',
  answer: null,
  categoryIds: [],
  sourceName: '',
  sourceUrl: '',
  isPublic: false,
};

function sameIdSet(left: string[], right: string[]) {
  if (left.length !== right.length) return false;

  const rightSet = new Set(right);
  return left.every((id) => rightSet.has(id));
}

export function areQuestionFormValuesEqual(left: QuestionFormValues, right: QuestionFormValues) {
  return (
    left.question === right.question &&
    JSON.stringify(left.answer) === JSON.stringify(right.answer) &&
    left.sourceName === right.sourceName &&
    left.sourceUrl === right.sourceUrl &&
    left.isPublic === right.isPublic &&
    sameIdSet(left.categoryIds, right.categoryIds)
  );
}
