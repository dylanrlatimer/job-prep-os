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

// The non-document fields held in React state.
// The `answer` document lives in the TipTap editor ref, not in state.
export type QuestionFields = Omit<QuestionFormValues, 'answer'>;

export const emptyQuestionFields: QuestionFields = {
  question: '',
  topicIds: [],
  sourceName: '',
  sourceUrl: '',
  isPublic: false,
};

function sameIdSet(left: string[], right: string[]) {
  if (left.length !== right.length) return false;
  const rightSet = new Set(right);
  return left.every((id) => rightSet.has(id));
}

export function areQuestionValuesEqual(left: QuestionFormValues, right: QuestionFormValues) {
  return (
    left.question === right.question &&
    documentsEqual(left.answer, right.answer) &&
    left.sourceName === right.sourceName &&
    left.sourceUrl === right.sourceUrl &&
    left.isPublic === right.isPublic &&
    sameIdSet(left.topicIds, right.topicIds)
  );
}
