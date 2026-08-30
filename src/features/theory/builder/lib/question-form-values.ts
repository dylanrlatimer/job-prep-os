import type { JSONContent } from '@tiptap/core';
import { documentsEqual } from '@/lib/tiptap/serialize-document';

export type QuestionFormValues = {
  question: string;
  answer: JSONContent | null;
  topicIds: string[];
  sourceName: string;
  sourceUrl: string;
  isPublic: boolean;
};

export type QuestionScalars = Omit<QuestionFormValues, 'answer'>;
export type QuestionFormSnapshot = QuestionFormValues;

export const emptyQuestionScalars: QuestionScalars = {
  question: '',
  topicIds: [],
  sourceName: '',
  sourceUrl: '',
  isPublic: false,
};

export const emptyQuestionFormValues: QuestionFormValues = {
  ...emptyQuestionScalars,
  answer: null,
};

function sameIdSet(left: string[], right: string[]) {
  if (left.length !== right.length) return false;

  const rightSet = new Set(right);
  return left.every((id) => rightSet.has(id));
}

export function toQuestionSnapshot(scalars: QuestionScalars, answer: JSONContent | null): QuestionFormSnapshot {
  return { ...scalars, answer };
}

export function areQuestionSnapshotsEqual(left: QuestionFormSnapshot, right: QuestionFormSnapshot) {
  return (
    left.question === right.question &&
    documentsEqual(left.answer, right.answer) &&
    left.sourceName === right.sourceName &&
    left.sourceUrl === right.sourceUrl &&
    left.isPublic === right.isPublic &&
    sameIdSet(left.topicIds, right.topicIds)
  );
}

/** @deprecated Use areQuestionSnapshotsEqual */
export function areQuestionFormValuesEqual(left: QuestionFormValues, right: QuestionFormValues) {
  return areQuestionSnapshotsEqual(left, right);
}
