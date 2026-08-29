import { attemptCountClassName } from '@/features/theory/lib/attempt-result-styles';

export type AttemptCountTotals = {
  incorrect: number;
  partial: number;
  correct: number;
};

type AttemptTotalsProps = {
  attempts: AttemptCountTotals;
  incorrectLabel: string;
  partialLabel: string;
  correctLabel: string;
};

export default function AttemptTotals({ attempts, incorrectLabel, partialLabel, correctLabel }: AttemptTotalsProps) {
  const { incorrect, partial, correct } = attempts;

  return (
    <span className='text-xs'>
      <span className={attemptCountClassName(incorrect, 'incorrect')}>{incorrectLabel}</span>
      <span className='text-muted-foreground'> · </span>
      <span className={attemptCountClassName(partial, 'partial')}>{partialLabel}</span>
      <span className='text-muted-foreground'> · </span>
      <span className={attemptCountClassName(correct, 'correct')}>{correctLabel}</span>
    </span>
  );
}
