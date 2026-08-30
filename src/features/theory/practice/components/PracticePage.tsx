'use client';

import { useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import AppShell from '@/common/components/AppShell';
import TopicList from '@/common/components/TopicList';
import AttemptTotals from '@/common/components/AttemptTotals';
import { primaryButtonClassName, secondaryButtonClassName } from '@/common/styles/form';
import { invalidateQuestionCaches } from '@/features/theory/api/invalidate-question-caches';
import { createAttempt, fetchPracticeReview } from '@/features/theory/practice/api/mutations';
import { practiceQuestionQueryOptions } from '@/features/theory/practice/api/queries';
import { attemptResultClassName } from '@/features/theory/lib/attempt-result-styles';
import type { PracticeAttemptResult, PracticeReviewResponse } from '@/features/theory/practice/api/contracts';
import PracticeSkeleton from './PracticeSkeleton';
import TiptapEditor, { type TiptapEditorRef } from '@/common/components/TiptapEditor';
import TiptapRenderer from '@/common/components/TiptapRenderer';
import { useToastStore } from '@/lib/store/use-toast-store';
import { cn } from '@/lib/cn';
import type { JSONContent } from '@tiptap/core';

type PracticePageProps = {
  questionId: string;
};

type SessionPhase = 'draft' | 'grading';

function hasAttempts(totals: { incorrect: number; partial: number; correct: number }) {
  return totals.incorrect + totals.partial + totals.correct > 0;
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

  const responseEditorRef = useRef<TiptapEditorRef>(null);
  const notesEditorRef = useRef<TiptapEditorRef>(null);

  const [phase, setPhase] = useState<SessionPhase>('draft');
  const [lockedResponse, setLockedResponse] = useState<JSONContent | null>(null);
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
    const isEmpty = responseEditorRef.current?.isEmpty() ?? true;
    setLockedResponse(isEmpty ? null : (responseEditorRef.current?.getJSON() ?? null));
    submitResponse();
  };

  const { mutate: recordAttempt, isPending: isRecording } = useMutation({
    mutationFn: () => {
      const notesIsEmpty = notesEditorRef.current?.isEmpty() ?? true;
      return createAttempt(questionId, {
        result: result!,
        response: lockedResponse,
        notes: notesIsEmpty ? null : (notesEditorRef.current?.getJSON() ?? null),
      });
    },
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
            {data.topics.length > 0 ? (
              <TopicList className='text-secondary-foreground' topics={data.topics} />
            ) : (
              <span className='text-muted-foreground'>{t('noTopics')}</span>
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
              <AttemptTotals
                attempts={review.attempts}
                incorrectLabel={t('attemptIncorrect', { count: review.attempts.incorrect })}
                partialLabel={t('attemptPartial', { count: review.attempts.partial })}
                correctLabel={t('attemptCorrect', { count: review.attempts.correct })}
              />
            ) : null}
          </div>
        </header>

        <div className='mx-auto mt-8 max-w-2xl space-y-6'>
          <div>
            <label className='mb-1.5 block text-xs text-secondary-foreground' htmlFor='response'>
              {t('responseLabel')}
            </label>
            {isGrading ? (
              <div className='rounded-sm border border-border bg-muted px-3 py-2 text-sm'>
                {lockedResponse ? (
                  <TiptapRenderer content={lockedResponse} />
                ) : (
                  <span className='text-muted-foreground'>{t('responseEmpty')}</span>
                )}
              </div>
            ) : (
              <TiptapEditor ref={responseEditorRef} initialContent={null} id='response' />
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
                <TiptapEditor ref={notesEditorRef} initialContent={null} id='notes' />
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
                      <span className={attemptResultClassName(attempt.result)}>{t(resultLabelKey(attempt.result))}</span>
                    </p>
                    {attempt.response ? (
                      <div className='mt-2'>
                        <p className='m-0 mb-1 text-xs text-secondary-foreground'>{t('historyResponse')}</p>
                        <TiptapRenderer content={attempt.response} />
                      </div>
                    ) : null}
                    {attempt.notes ? (
                      <div className='mt-2'>
                        <p className='m-0 mb-1 text-xs text-secondary-foreground'>{t('historyNotes')}</p>
                        <TiptapRenderer content={attempt.notes} />
                      </div>
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
