'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import AppShell from '@/common/components/AppShell';
import AttemptHistoryList from '@/common/components/AttemptHistoryList';
import AttemptTotals from '@/common/components/AttemptTotals';
import BackLink from '@/common/components/BackLink';
import PageLoadError from '@/common/components/PageLoadError';
import SourceCitation from '@/common/components/SourceCitation';
import TopicList from '@/common/components/TopicList';
import TiptapRenderer from '@/common/components/TiptapRenderer';
import { exerciseDetailQueryOptions } from '@/features/exercises/detail/api/queries';
import { resultLabelKey } from '@/features/theory/lib/attempt-result-styles';
import { primaryButtonClassName, secondaryButtonClassName } from '@/common/styles/form';
import { cn } from '@/lib/cn';
import ExerciseDetailSkeleton from './ExerciseDetailSkeleton';

type ExerciseDetailPageProps = {
  exerciseId: string;
};

export default function ExerciseDetailPage({ exerciseId }: ExerciseDetailPageProps) {
  const t = useTranslations('ExerciseDetailPage');
  const [answerRevealed, setAnswerRevealed] = useState(false);
  const { data, isPending, isError, refetch, isFetching } = useQuery(exerciseDetailQueryOptions(exerciseId));

  if (isPending) {
    return (
      <AppShell>
        <ExerciseDetailSkeleton />
      </AppShell>
    );
  }

  if (isError || !data) {
    return (
      <PageLoadError
        title={t('title')}
        message={t('loadError')}
        onRetry={() => refetch()}
        isRetrying={isFetching}
        retryLabel={t('retry')}
        retryingLabel={t('retrying')}
      />
    );
  }

  return (
    <AppShell>
      <div className='px-4 py-8 md:px-8'>
        <BackLink href='/exercises' label={t('backToRepository')} />

        <header className='mt-4 border-b border-border pb-6'>
          <div className='flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between'>
            <div className='min-w-0 flex-1'>
              <h1 className='m-0 text-lg font-medium leading-relaxed text-foreground'>{data.title}</h1>

              <div className='mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs'>
                {data.topics.length > 0 ? (
                  <TopicList className='text-secondary-foreground' topics={data.topics} />
                ) : (
                  <span className='text-muted-foreground'>{t('noTopics')}</span>
                )}

                <SourceCitation name={data.sourceName} url={data.sourceUrl} />

                <AttemptTotals
                  attempts={data.attempts}
                  incorrectLabel={t('attemptIncorrect', { count: data.attempts.incorrect })}
                  partialLabel={t('attemptPartial', { count: data.attempts.partial })}
                  correctLabel={t('attemptCorrect', { count: data.attempts.correct })}
                  emptyLabel={t('noAttempts')}
                />
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
                    <TiptapRenderer content={choice.content} className={cn(answerRevealed && choice.isCorrect && 'text-success')} />
                    {answerRevealed && choice.isCorrect ? <p className='m-0 mt-1 text-xs text-success'>{t('correctChoice')}</p> : null}
                  </div>
                </li>
              ))}
            </ul>

            {!answerRevealed ? (
              <button type='button' className={cn(secondaryButtonClassName, 'mt-4')} onClick={() => setAnswerRevealed(true)}>
                {t('revealAnswer')}
              </button>
            ) : null}
          </section>

          {answerRevealed && data.explanation ? (
            <section className='border-t border-border pt-6'>
              <h2 className='m-0 text-xs text-secondary-foreground'>{t('explanationLabel')}</h2>
              <TiptapRenderer content={data.explanation} className='mt-2' />
            </section>
          ) : null}

          <section className='border-t border-border pt-6'>
            <AttemptHistoryList
              title={t('historyTitle')}
              emptyLabel={t('historyEmpty')}
              items={data.attemptHistory}
              resultLabel={(result) => t(resultLabelKey(result))}
            />
          </section>
        </div>
      </div>
    </AppShell>
  );
}
