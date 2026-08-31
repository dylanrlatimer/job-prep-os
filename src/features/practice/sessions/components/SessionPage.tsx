'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import AppShell from '@/common/components/AppShell';
import PageLoadError from '@/common/components/PageLoadError';
import { primaryButtonClassName, secondaryButtonClassName } from '@/common/styles/form';
import { invalidatePracticeHistory, invalidatePracticeSession, invalidatePracticeSessions } from '@/features/practice/api/invalidate-caches';
import { skipSessionItem } from '@/features/practice/sessions/api/mutations';
import { sessionNextQueryOptions, sessionQueryOptions } from '@/features/practice/sessions/api/queries';
import SessionItemExercise from './SessionItemExercise';
import SessionItemTheory from './SessionItemTheory';

type SessionPageProps = {
  sessionId: string;
};

export default function SessionPage({ sessionId }: SessionPageProps) {
  const t = useTranslations('SessionPage');
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data, isPending, isError, refetch, isFetching } = useQuery(sessionQueryOptions(sessionId));

  const finishItem = async (sessionComplete: boolean) => {
    if (sessionComplete) {
      await Promise.all([invalidatePracticeSessions(queryClient), invalidatePracticeHistory(queryClient)]);
    }

    const next = queryClient.getQueryData(sessionNextQueryOptions(sessionId).queryKey);
    if (next) {
      queryClient.setQueryData(sessionQueryOptions(sessionId).queryKey, next);
      queryClient.removeQueries({ queryKey: sessionNextQueryOptions(sessionId).queryKey });
      return;
    }

    await invalidatePracticeSession(queryClient, sessionId);
  };

  const { mutate: skip, isPending: isSkipping } = useMutation({
    mutationFn: (itemId: string) => skipSessionItem(sessionId, itemId),
    onSuccess: async (response) => {
      await finishItem(response.sessionComplete);
    },
  });

  if (isPending) {
    return (
      <AppShell>
        <div className='px-4 py-8 md:px-8'>
          <div className='h-6 w-40 animate-pulse rounded-sm bg-card-muted' />
          <div className='mt-8 h-32 animate-pulse rounded-sm bg-card-muted' />
        </div>
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

  const isComplete = data.status === 'completed' || (!data.currentItem && !data.unavailableItemId);

  return (
    <AppShell>
      <div className='px-4 py-8 md:px-8'>
        <div className='flex flex-wrap items-center justify-between gap-3'>
          <button type='button' className={secondaryButtonClassName} onClick={() => router.push('/practice')}>
            {t('saveAndExit')}
          </button>
          <p className='m-0 text-xs text-muted-foreground'>{t('progress', { answered: data.progress.answered, total: data.progress.total })}</p>
        </div>

        {isComplete ? (
          <div className='mx-auto mt-10 max-w-2xl'>
            <h1 className='m-0 text-lg font-medium text-foreground'>{t('complete')}</h1>
            <p className='mt-2 text-sm text-muted-foreground'>{t('completeDescription')}</p>
            <p className='mt-4 text-sm text-secondary-foreground'>
              {t('completeTotals', {
                answered: data.progress.answered,
                skipped: data.progress.skipped,
                total: data.progress.total,
              })}
            </p>
            <div className='mt-6 flex flex-wrap gap-2'>
              <Link href={`/practice/history/${sessionId}`} className={primaryButtonClassName}>
                {t('viewSession')}
              </Link>
              <Link href='/practice' className={secondaryButtonClassName}>
                {t('backToPractice')}
              </Link>
            </div>
          </div>
        ) : data.unavailableItemId ? (
          <div className='mx-auto mt-10 max-w-2xl'>
            <p className='m-0 text-sm text-foreground'>{t('itemDeleted')}</p>
            <button type='button' className={`${primaryButtonClassName} mt-4`} disabled={isSkipping} onClick={() => skip(data.unavailableItemId!)}>
              {isSkipping ? t('skipping') : t('skip')}
            </button>
          </div>
        ) : data.currentItem?.contentType === 'theory' ? (
          <SessionItemTheory
            item={data.currentItem}
            sessionId={sessionId}
            onAnswered={finishItem}
            onSkip={() => skip(data.currentItem!.id)}
            isSkipping={isSkipping}
          />
        ) : data.currentItem?.contentType === 'exercise' ? (
          <SessionItemExercise
            item={data.currentItem}
            sessionId={sessionId}
            onAnswered={finishItem}
            onSkip={() => skip(data.currentItem!.id)}
            isSkipping={isSkipping}
          />
        ) : null}
      </div>
    </AppShell>
  );
}
