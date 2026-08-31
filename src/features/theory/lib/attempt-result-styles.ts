export type AttemptResult = 'incorrect' | 'partial' | 'correct';

export function attemptResultClassName(result: AttemptResult) {
  if (result === 'correct') return 'text-success';
  if (result === 'incorrect') return 'text-destructive-bright';
  return 'text-warning';
}

export function attemptCountClassName(count: number, type: AttemptResult) {
  if (count === 0) return 'text-muted-foreground';
  if (type === 'incorrect') return 'text-destructive-bright';
  if (type === 'partial') return 'text-warning';
  return 'text-success';
}

export function hasAttempts(totals: { incorrect: number; partial: number; correct: number }) {
  return totals.incorrect + totals.partial + totals.correct > 0;
}

export function resultLabelKey(result: AttemptResult) {
  if (result === 'incorrect') return 'resultIncorrect' as const;
  if (result === 'partial') return 'resultPartial' as const;
  return 'resultCorrect' as const;
}
