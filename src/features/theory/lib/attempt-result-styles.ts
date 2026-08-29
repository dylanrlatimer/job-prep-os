import type { PracticeAttemptResult } from '@/features/theory/practice/api/contracts';

export function attemptResultClassName(result: PracticeAttemptResult) {
  if (result === 'correct') return 'text-success';
  if (result === 'incorrect') return 'text-destructive-bright';
  return 'text-warning';
}

export function attemptCountClassName(count: number, type: 'incorrect' | 'partial' | 'correct') {
  if (count === 0) return 'text-muted-foreground';
  if (type === 'incorrect') return 'text-destructive-bright';
  if (type === 'partial') return 'text-warning';
  return 'text-success';
}
