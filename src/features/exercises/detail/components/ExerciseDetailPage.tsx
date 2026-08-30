'use client';

import { useQuery } from '@tanstack/react-query';
import { ChevronLeft } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import AppShell from '@/common/components/AppShell';
import AttemptTotals from '@/common/components/AttemptTotals';
import TiptapRenderer from '@/common/components/TiptapRenderer';
import { exerciseDetailQueryOptions } from '@/features/exercises/detail/api/queries';
import type { ExerciseAttemptResult } from '@/features/exercises/detail/api/contracts';
import { attemptResultClassName } from '@/features/theory/lib/attempt-result-styles';
import { primaryButtonClassName, secondaryButtonClassName } from '@/common/styles/form';
import { cn } from '@/lib/cn';
import ExerciseDetailSkeleton from './ExerciseDetailSkeleton';

type ExerciseDetailPageProps = {
  exerciseId: string;
};

function hasAttempts(totals: { incorrect: number; partial: number; correct: number }) {
  return totals.incorrect + totals.partial + totals.correct > 0;
}

function resultLabelKey(result: ExerciseAttemptResult) {
  if (result === 'incorrect') return 'resultIncorrect' as const;
  if (result === 'partial') return 'resultPartial' as const;
  return 'resultCorrect' as const;
}

export default function ExerciseDetailPage({ exerciseId }: ExerciseDetailPageProps) {
  const t = useTranslations('ExerciseDetailPage');
  const locale = useLocale();
  const { data, isPending, isError, refetch, isFetching } = useQuery(exerciseDetailQueryOptions(exerciseId));

  const formatDate = (value: string) =>
    new Date(value).toLocaleString(locale, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });

  if (isPending) {
    return (
      <AppShell>
        <ExerciseDetailSkeleton />
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

  return (
    <AppShell>
      <div className='px-4 py-8 md:px-8'>
        <Link href='/exercises' className='inline-flex items-center gap-1 text-sm text-muted-foreground no-underline transition-colors hover:text-foreground'>
          <ChevronLeft size={16} strokeWidth={1.75} aria-hidden='true' />
          {t('backToRepository')}
        </Link>

        <header className='mt-4 border-b border-border pb-6'>
          <div className='flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between'>
            <div className='min-w-0 flex-1'>
              <h1 className='m-0 text-lg font-medium leading-relaxed text-foreground'>{data.title}</h1>

              <div className='mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs'>
                {data.topics.length > 0 ? (
                  <span className='text-secondary-foreground'>{data.topics.map((topic) => topic.name).join(' · ')}</span>
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

                {hasAttempts(data.attempts) ? (
                  <AttemptTotals
                    attempts={data.attempts}
                    incorrectLabel={t('attemptIncorrect', { count: data.attempts.incorrect })}
                    partialLabel={t('attemptPartial', { count: data.attempts.partial })}
                    correctLabel={t('attemptCorrect', { count: data.attempts.correct })}
                  />
                ) : (
                  <span className='text-muted-foreground'>{t('noAttempts')}</span>
                )}
              </div>
            </div>

            <div className='flex shrink-0 flex-wrap gap-2'>
              {data.isOwner ? (
                <Link href={`/exercises/${exerciseId}/edit`} className={secondaryButtonClassName}>
                  {t('edit')}
                </Link>
              ) : null}
              <Link href={`/exercises/${exerciseId}/practice`} className={primaryButtonClassName}>
                {t('practice')}
              </Link>
            </div>
          </div>
        </header>

        <div className='mx-auto mt-8 max-w-2xl space-y-8'>
          <section>
            <TiptapRenderer content={data.prompt} />
          </section>

          <section>
            <h2 className='m-0 text-xs text-secondary-foreground'>{t('choicesLabel')}</h2>
            <ul className='m-0 mt-3 list-none space-y-3 p-0'>
              {data.choices.map((choice) => (
                <li key={choice.id} className='flex items-start gap-3'>
                  <span className='mt-0.5 shrink-0 text-sm text-muted-foreground'>{choice.position + 1}.</span>
                  <div className='min-w-0 flex-1'>
                    <TiptapRenderer content={choice.content} className={cn(choice.isCorrect && 'text-success')} />
                    {choice.isCorrect ? <p className='m-0 mt-1 text-xs text-success'>{t('correctChoice')}</p> : null}
                  </div>
                </li>
              ))}
            </ul>
          </section>

          {data.explanation ? (
            <section className='border-t border-border pt-6'>
              <h2 className='m-0 text-xs text-secondary-foreground'>{t('explanationLabel')}</h2>
              <TiptapRenderer content={data.explanation} className='mt-2' />
            </section>
          ) : null}

          <section className='border-t border-border pt-6'>
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
        </div>
      </div>
    </AppShell>
  );
}
