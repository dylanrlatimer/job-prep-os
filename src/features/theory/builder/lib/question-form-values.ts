export type QuestionFormValues = {
  question: string;
  answer: string;
  categoryIds: string[];
  sourceName: string;
  sourceUrl: string;
  isPublic: boolean;
};

export const emptyQuestionFormValues: QuestionFormValues = {
  question: '',
  answer: '',
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
    left.answer === right.answer &&
    left.sourceName === right.sourceName &&
    left.sourceUrl === right.sourceUrl &&
    left.isPublic === right.isPublic &&
    sameIdSet(left.categoryIds, right.categoryIds)
  );
}
