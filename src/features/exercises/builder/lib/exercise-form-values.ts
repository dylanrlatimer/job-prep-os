import type { JSONContent } from '@tiptap/core';
import { documentsEqual } from '@/lib/tiptap/serialize-document';

export type ExerciseChoiceFormRow = {
  id: string;
  isCorrect: boolean;
};

export type ExerciseFormValues = {
  title: string;
  prompt: JSONContent | null;
  explanation: JSONContent | null;
  topicIds: string[];
  sourceName: string;
  sourceUrl: string;
  isPublic: boolean;
  allowMultiple: boolean;
  choices: ExerciseChoiceFormRow[];
};

export type ExerciseChoiceDocument = {
  id: string;
  content: JSONContent | null;
};

export type ExerciseScalars = Omit<ExerciseFormValues, 'prompt' | 'explanation'>;
export type ExerciseFormSnapshot = ExerciseFormValues & {
  choiceDocuments: ExerciseChoiceDocument[];
};

export const MIN_CHOICES = 2;
export const MAX_CHOICES = 8;

function createChoiceRow(isCorrect = false): ExerciseChoiceFormRow {
  return {
    id: crypto.randomUUID(),
    isCorrect,
  };
}

export const defaultChoiceRows: ExerciseChoiceFormRow[] = [createChoiceRow(), createChoiceRow()];

export const emptyExerciseScalars: ExerciseScalars = {
  title: '',
  topicIds: [],
  sourceName: '',
  sourceUrl: '',
  isPublic: false,
  allowMultiple: false,
  choices: defaultChoiceRows,
};

export const emptyExerciseFormValues: ExerciseFormValues = {
  ...emptyExerciseScalars,
  prompt: null,
  explanation: null,
};

function sameIdSet(left: string[], right: string[]) {
  if (left.length !== right.length) return false;

  const rightSet = new Set(right);
  return left.every((id) => rightSet.has(id));
}

function choicesEqual(left: ExerciseChoiceFormRow[], right: ExerciseChoiceFormRow[]) {
  if (left.length !== right.length) return false;

  return left.every((choice, index) => {
    const other = right[index];
    return choice.id === other.id && choice.isCorrect === other.isCorrect;
  });
}

export function toExerciseSnapshot(
  scalars: ExerciseScalars,
  prompt: JSONContent | null,
  explanation: JSONContent | null,
  choiceDocuments: ExerciseChoiceDocument[],
): ExerciseFormSnapshot {
  return {
    ...scalars,
    prompt,
    explanation,
    choiceDocuments,
  };
}

export function areExerciseSnapshotsEqual(left: ExerciseFormSnapshot, right: ExerciseFormSnapshot) {
  if (
    left.title !== right.title ||
    !documentsEqual(left.prompt, right.prompt) ||
    !documentsEqual(left.explanation, right.explanation) ||
    left.sourceName !== right.sourceName ||
    left.sourceUrl !== right.sourceUrl ||
    left.isPublic !== right.isPublic ||
    left.allowMultiple !== right.allowMultiple ||
    !sameIdSet(left.topicIds, right.topicIds) ||
    !choicesEqual(left.choices, right.choices) ||
    left.choiceDocuments.length !== right.choiceDocuments.length
  ) {
    return false;
  }

  return left.choiceDocuments.every((choice, index) => {
    const other = right.choiceDocuments[index];
    return choice.id === other.id && documentsEqual(choice.content, other.content);
  });
}

export function createChoiceRowFromLoaded(isCorrect: boolean): ExerciseChoiceFormRow {
  return createChoiceRow(isCorrect);
}
