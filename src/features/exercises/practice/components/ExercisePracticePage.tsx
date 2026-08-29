'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import AppShell from '@/common/components/AppShell';
import TiptapRenderer from '@/common/components/TiptapRenderer';
import { primaryButtonClassName, secondaryButtonClassName } from '@/common/styles/form';
import { invalidateExerciseCaches } from '@/features/exercises/api/invalidate-caches';
import { submitExerciseAnswer } from '@/features/exercises/practice/api/mutations';
import { exercisePracticeQueryOptions } from '@/features/exercises/practice/api/queries';
import type {
  ExercisePracticeAttemptResult,
  SubmitExerciseAnswerResponse,
} from '@/features/exercises/practice/api/contracts';
import { attemptResultClassName } from '@/features/theory/lib/attempt-result-styles';
import ExercisePracticeSkeleton from './ExercisePracticeSkeleton';
import { cn } from '@/lib/cn';

type ExercisePracticePageProps = {
  exerciseId: string;
};

type SessionPhase = 'draft' | 'result';

function hasAttempts(totals: { incorrect: number; partial: number; correct: number }) {
  return totals.incorrect + totals.partial + totals.correct > 0;
}

function resultLabelKey(result: ExercisePracticeAttemptResult) {
  if (result === 'incorrect') return 'resultIncorrect' as const;
  if (result === 'partial') return 'resultPartial' as const;
  return 'resultCorrect' as const;
}

function choiceResultClassName({
  choiceId,
  selectedChoiceIds,
  correctChoiceIds,
}: {
  choiceId: string;
  selectedChoiceIds: string[];
  correctChoiceIds: string[];
}) {
  const isCorrect = correctChoiceIds.includes(choiceId);
  const isSelected = selectedChoiceIds.includes(choiceId);

  if (isCorrect) {
    return 'border-success bg-success/10';
  }

  if (isSelected) {
    return 'border-destructive-bright bg-destructive-bright/10';
  }

  return 'border-border bg-card';
}

export default function ExercisePracticePage({ exerciseId }: ExercisePracticePageProps) {
  const t = useTranslations('ExercisePracticePage');
  const locale = useLocale();
  const queryClient = useQueryClient();

  const { data, isPending, isError, refetch, isFetching } = useQuery(exercisePracticeQueryOptions(exerciseId));

  const [phase, setPhase] = useState<SessionPhase>('draft');
  const [selectedChoiceIds, setSelectedChoiceIds] = useState<string[]>([]);
  const [submitResult, setSubmitResult] = useState<SubmitExerciseAnswerResponse | null>(null);

  const { mutate: submitAnswer, isPending: isSubmitting } = useMutation({
    mutationFn: () => submitExerciseAnswer(exerciseId, { selectedChoiceIds }),
    onSuccess: async (response) => {
      setSubmitResult(response);
      setPhase('result');
      await invalidateExerciseCaches(queryClient, exerciseId);
    },
  });

  const formatDate = (value: string) =>
    new Date(value).toLocaleString(locale, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });

  const toggleChoice = (choiceId: string) => {
    if (!data) {
      return;
    }

    if (data.allowMultiple) {
      setSelectedChoiceIds((current) =>
        current.includes(choiceId) ? current.filter((id) => id !== choiceId) : [...current, choiceId],
      );
      return;
    }

    setSelectedChoiceIds([choiceId]);
  };

  const handleTryAgain = () => {
    setPhase('draft');
    setSelectedChoiceIds([]);
    setSubmitResult(null);
  };

  if (isPending) {
    return (
      <AppShell>
        <ExercisePracticeSkeleton />
      </AppShell>
    );
  }

  if (isError || !data) {
    return (
      <AppShell>
        <div className='px-4 py-8 md:px-8'>
          <h1 className='m-0 text-lg font-medium text-foreground'>{t('title')}</h1>
          <p className='mt-2 text-sm text-muted-foreground'>{t('loadError')}</p>
          <button type='button' className={cn(secondaryButtonClassName, 'mt-4')} onClick={() => refetch()} disabled={isFetching}>
            {isFetching ? t('retrying') : t('retry')}
          </button>
        </div>
      </AppShell>
    );
  }

  const isResult = phase === 'result' && submitResult !== null;

  return (
    <AppShell>
      <div className='px-4 py-8 md:px-8'>
        <Link
          href='/exercises'
          className='inline-flex items-center gap-1 text-sm text-muted-foreground no-underline transition-colors hover:text-foreground'
        >
          <ChevronLeft size={16} strokeWidth={1.75} aria-hidden='true' />
          {t('backToRepository')}
        </Link>

        <header className='mt-4 border-b border-border pb-6'>
          <div className='text-lg font-medium leading-relaxed text-foreground'>
            <TiptapRenderer content={data.prompt} />
          </div>

          <div className='mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs'>
            {data.topics.length > 0 ? (
              <span className='text-secondary-foreground'>{data.topics.map((topic) => topic.name).join(' · ')}</span>
            ) : (
              <span className='text-muted-foreground'>{t('uncategorized')}</span>
            )}

            {data.sourceName ? (
              <span className='text-secondary-foreground'>
                {data.sourceUrl ? (
                  <a href={data.sourceUrl} target='_blank' rel='noopener noreferrer' className='text-link underline-offset-2 hover:underline'>
                    {data.sourceName}
                  </a>
                ) : (
                  data.sourceName
                )}
              </span>
            ) : null}

            {hasAttempts(data.attempts) ? (
              <span className='text-muted-foreground'>
                {t('attemptTotals', {
                  incorrect: data.attempts.incorrect,
                  partial: data.attempts.partial,
                  correct: data.attempts.correct,
                })}
              </span>
            ) : null}
          </div>
        </header>

        <div className='mx-auto mt-8 max-w-2xl space-y-6'>
          <fieldset className='m-0 border-0 p-0'>
            <legend className='mb-3 block text-xs text-secondary-foreground'>{t('choicesLabel')}</legend>

            <div className='space-y-3'>
              {data.choices.map((choice) => {
                const inputType = data.allowMultiple ? 'checkbox' : 'radio';
                const isChecked = selectedChoiceIds.includes(choice.id);

                return (
                  <label
                    key={choice.id}
                    className={cn(
                      'flex cursor-pointer items-start gap-3 rounded-sm border px-3 py-3 text-sm transition-colors',
                      isResult
                        ? choiceResultClassName({
                            choiceId: choice.id,
                            selectedChoiceIds,
                            correctChoiceIds: submitResult.correctChoiceIds,
                          })
                        : isChecked
                          ? 'border-primary bg-primary/5'
                          : 'border-border bg-card hover:border-primary/40',
                    )}
                  >
                    {!isResult ? (
                      <input
                        type={inputType}
                        name='choice'
                        className='mt-1 size-3.5 shrink-0 cursor-pointer accent-primary'
                        checked={isChecked}
                        onChange={() => toggleChoice(choice.id)}
                      />
                    ) : null}
                    <div className='min-w-0 flex-1'>
                      <TiptapRenderer content={choice.content} />
                    </div>
                  </label>
                );
              })}
            </div>
          </fieldset>

          {!isResult ? (
            <button
              type='button'
              className={primaryButtonClassName}
              onClick={() => submitAnswer()}
              disabled={selectedChoiceIds.length === 0 || isSubmitting}
            >
              {isSubmitting ? t('submitting') : t('submit')}
            </button>
          ) : (
            <div className='space-y-6'>
              <p className='m-0 text-sm'>
                <span className='text-secondary-foreground'>{t('resultLabel')}</span>
                <span className='text-muted-foreground'> · </span>
                <span className={attemptResultClassName(submitResult.result)}>{t(resultLabelKey(submitResult.result))}</span>
              </p>

              {submitResult.explanation ? (
                <div className='rounded-sm border border-border bg-card px-4 py-3'>
                  <p className='m-0 mb-2 text-xs text-secondary-foreground'>{t('explanationLabel')}</p>
                  <TiptapRenderer content={submitResult.explanation} />
                </div>
              ) : null}

              <button type='button' className={secondaryButtonClassName} onClick={handleTryAgain}>
                {t('tryAgain')}
              </button>
            </div>
          )}
        </div>

        {isResult ? (
          <section className='mx-auto mt-10 max-w-2xl border-t border-border pt-6'>
            <h2 className='m-0 text-sm font-medium text-foreground'>{t('historyTitle')}</h2>

            {data.attemptHistory.length === 0 ? (
              <p className='mt-3 text-sm text-muted-foreground'>{t('historyEmpty')}</p>
            ) : (
              <ul className='m-0 mt-4 list-none p-0'>
                {data.attemptHistory.map((attempt, index) => (
                  <li key={attempt.id} className={cn(index > 0 && 'mt-4 border-t border-border pt-4')}>
                    <p className='m-0 text-sm'>
                      <span className='text-muted-foreground'>{formatDate(attempt.createdAt)}</span>
                      <span className='text-muted-foreground'> · </span>
                      <span className={attemptResultClassName(attempt.result)}>{t(resultLabelKey(attempt.result))}</span>
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ) : null}
      </div>
    </AppShell>
  );
}
