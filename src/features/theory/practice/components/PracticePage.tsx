'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import AppShell from '@/common/components/AppShell';
import { primaryButtonClassName, secondaryButtonClassName, textareaClassName } from '@/common/styles/form';
import { invalidateQuestionCaches } from '@/features/theory/api/invalidate-question-caches';
import { createAttempt, fetchPracticeReview } from '@/features/theory/practice/api/mutations';
import { practiceQuestionQueryOptions } from '@/features/theory/practice/api/queries';
import type { PracticeAttemptResult, PracticeReviewResponse } from '@/features/theory/practice/api/contracts';
import PracticeSkeleton from './PracticeSkeleton';
import TiptapRenderer from '@/common/components/TiptapRenderer';
import { useToastStore } from '@/lib/store/use-toast-store';
import { cn } from '@/lib/cn';

type PracticePageProps = {
  questionId: string;
};

type SessionPhase = 'draft' | 'grading';

function hasAttempts(totals: { incorrect: number; partial: number; correct: number }) {
  return totals.incorrect + totals.partial + totals.correct > 0;
}

function resultClassName(result: PracticeAttemptResult) {
  if (result === 'correct') return 'text-success';
  if (result === 'incorrect') return 'text-destructive-bright';
  return 'text-muted-foreground';
}

function resultLabelKey(result: PracticeAttemptResult) {
  if (result === 'incorrect') return 'resultIncorrect' as const;
  if (result === 'partial') return 'resultPartial' as const;
  return 'resultCorrect' as const;
}

export default function PracticePage({ questionId }: PracticePageProps) {
  const t = useTranslations('PracticePage');
  const locale = useLocale();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data, isPending, isError, refetch, isFetching } = useQuery(practiceQuestionQueryOptions(questionId));

  const [phase, setPhase] = useState<SessionPhase>('draft');
  const [response, setResponse] = useState('');
  const [lockedResponse, setLockedResponse] = useState('');
  const [notes, setNotes] = useState('');
  const [result, setResult] = useState<PracticeAttemptResult | null>(null);
  const [review, setReview] = useState<PracticeReviewResponse | null>(null);

  const { mutate: submitResponse, isPending: isSubmitting } = useMutation({
    mutationFn: () => fetchPracticeReview(questionId),
    onSuccess: (reviewData) => {
      setReview(reviewData);
      setPhase('grading');
    },
  });

  const handleSubmit = () => {
    setLockedResponse(response);
    submitResponse();
  };

  const { mutate: recordAttempt, isPending: isRecording } = useMutation({
    mutationFn: () =>
      createAttempt(questionId, {
        result: result!,
        response: lockedResponse,
        notes,
      }),
    onSuccess: async () => {
      await invalidateQuestionCaches(queryClient, questionId);
      useToastStore.getState().addToast(t('recordSuccess'), 'success');
      router.push(`/theory/${questionId}`);
    },
  });

  const formatDate = (value: string) =>
    new Date(value).toLocaleString(locale, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });

  if (isPending) {
    return (
      <AppShell>
        <PracticeSkeleton />
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

  const isGrading = phase === 'grading' && review !== null;
  const canRecord = isGrading && result !== null && !isRecording;

  return (
    <AppShell>
      <div className='px-4 py-8 md:px-8'>
        <Link href='/' className='inline-flex items-center gap-1 text-sm text-muted-foreground no-underline transition-colors hover:text-foreground'>
          <ChevronLeft size={16} strokeWidth={1.75} aria-hidden='true' />
          {t('backToRepository')}
        </Link>

        <header className='mt-4 border-b border-border pb-6'>
          <h1 className='m-0 text-lg font-medium leading-relaxed text-foreground'>{data.question}</h1>

          <div className='mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs'>
            {data.categories.length > 0 ? (
              <span className='text-secondary-foreground'>{data.categories.map((category) => category.name).join(' · ')}</span>
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

            {isGrading && hasAttempts(review.attempts) ? (
              <span className='text-muted-foreground'>
                {t('attemptTotals', {
                  incorrect: review.attempts.incorrect,
                  partial: review.attempts.partial,
                  correct: review.attempts.correct,
                })}
              </span>
            ) : null}
          </div>
        </header>

        <div className='mx-auto mt-8 max-w-2xl space-y-6'>
          <div>
            <label className='mb-1.5 block text-xs text-secondary-foreground' htmlFor='response'>
              {t('responseLabel')}
            </label>
            {isGrading ? (
              <div className='rounded-sm border border-border bg-muted px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap text-foreground'>
                {lockedResponse || <span className='text-muted-foreground'>{t('responseEmpty')}</span>}
              </div>
            ) : (
              <textarea
                id='response'
                className={textareaClassName}
                value={response}
                onChange={(event) => setResponse(event.target.value)}
                placeholder={t('responsePlaceholder')}
                rows={6}
              />
            )}
          </div>

          {!isGrading ? (
            <button type='button' className={primaryButtonClassName} onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? t('submitting') : t('submit')}
            </button>
          ) : (
            <div className='space-y-6'>
              <div className='rounded-sm border border-border bg-card px-4 py-3'>
                <p className='m-0 mb-2 text-xs text-secondary-foreground'>{t('referenceAnswerLabel')}</p>
                <TiptapRenderer content={review.answer} />
              </div>

              <div>
                <p className='m-0 mb-1.5 text-xs text-secondary-foreground'>{t('resultLabel')}</p>
                <div className='flex flex-col gap-2 sm:flex-row sm:gap-6'>
                  {(['incorrect', 'partial', 'correct'] as const).map((option) => (
                    <label key={option} className='flex cursor-pointer items-center gap-2 text-sm text-foreground'>
                      <input
                        type='radio'
                        name='result'
                        className='size-3.5 cursor-pointer accent-primary'
                        checked={result === option}
                        onChange={() => setResult(option)}
                      />
                      {t(resultLabelKey(option))}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className='mb-1.5 block text-xs text-secondary-foreground' htmlFor='notes'>
                  {t('notesLabel')}
                </label>
                <textarea
                  id='notes'
                  className={textareaClassName}
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder={t('notesPlaceholder')}
                  rows={3}
                />
              </div>

              <div className='flex justify-end'>
                <button type='button' className={primaryButtonClassName} onClick={() => recordAttempt()} disabled={!canRecord}>
                  {isRecording ? t('recording') : t('recordAttempt')}
                </button>
              </div>
            </div>
          )}
        </div>

        {isGrading ? (
          <section className='mx-auto mt-10 max-w-2xl border-t border-border pt-6'>
            <h2 className='m-0 text-sm font-medium text-foreground'>{t('historyTitle')}</h2>

            {review.attemptHistory.length === 0 ? (
              <p className='mt-3 text-sm text-muted-foreground'>{t('historyEmpty')}</p>
            ) : (
              <ul className='m-0 mt-4 list-none p-0'>
                {review.attemptHistory.map((attempt, index) => (
                  <li key={attempt.id} className={cn(index > 0 && 'mt-4 border-t border-border pt-4')}>
                    <p className='m-0 text-sm'>
                      <span className='text-muted-foreground'>{formatDate(attempt.createdAt)}</span>
                      <span className='text-muted-foreground'> · </span>
                      <span className={resultClassName(attempt.result)}>{t(resultLabelKey(attempt.result))}</span>
                    </p>
                    {attempt.response ? (
                      <p className='m-0 mt-2 whitespace-pre-wrap text-sm text-foreground'>
                        <span className='text-secondary-foreground'>{t('historyResponse')}</span> {attempt.response}
                      </p>
                    ) : null}
                    {attempt.notes ? (
                      <p className='m-0 mt-2 whitespace-pre-wrap text-sm text-foreground'>
                        <span className='text-secondary-foreground'>{t('historyNotes')}</span> {attempt.notes}
                      </p>
                    ) : null}
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
