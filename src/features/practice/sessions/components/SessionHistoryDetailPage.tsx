'use client';

import { useQuery } from '@tanstack/react-query';
import { useLocale, useTranslations } from 'next-intl';
import AppShell from '@/common/components/AppShell';
import BackLink from '@/common/components/BackLink';
import PageLoadError from '@/common/components/PageLoadError';
import TopicList from '@/common/components/TopicList';
import { attemptResultClassName, resultLabelKey } from '@/features/theory/lib/attempt-result-styles';
import { sessionHistoryDetailQueryOptions } from '@/features/practice/sessions/api/queries';
import type { ContentFilter } from '@/features/practice/sessions/api/contracts';
import { formatSessionDate, sessionTopicLabel } from '@/features/practice/sessions/lib/session-title';

function contentFilterLabel(filter: ContentFilter, t: (key: string) => string) {
  if (filter === 'theory') return t('contentFilterTheory');
  if (filter === 'exercises') return t('contentFilterExercises');
  return t('contentFilterAll');
}

type SessionHistoryDetailPageProps = {
  sessionId: string;
};

export default function SessionHistoryDetailPage({ sessionId }: SessionHistoryDetailPageProps) {
  const t = useTranslations('SessionHistoryDetailPage');
  const locale = useLocale();
  const { data, isPending, isError, refetch, isFetching } = useQuery(sessionHistoryDetailQueryOptions(sessionId));

  const formatDate = (value: string) =>
    new Date(value).toLocaleString(locale, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });

  if (isPending) {
    return (
      <AppShell>
        <div className='px-4 py-8 md:px-8'>
          <div className='h-6 w-40 animate-pulse rounded-sm bg-card-muted' />
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

  return (
    <AppShell>
      <div className='px-4 py-8 md:px-8'>
        <BackLink href='/practice/history' label={t('back')} />

        <header className='mt-4 border-b border-border pb-6'>
          <h1 className='m-0 text-lg font-medium text-foreground'>
            {t('sessionTitle', {
              date: formatSessionDate(data.createdAt),
              topics: sessionTopicLabel(data.topicNames, t('topicNamesAll')),
            })}
          </h1>
          <div className='mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-secondary-foreground'>
            <span>{formatDate(data.completedAt)}</span>
            <span>{contentFilterLabel(data.contentFilter, t)}</span>
            <span>
              {t('resultTotals', {
                incorrect: data.result.incorrect,
                partial: data.result.partial,
                correct: data.result.correct,
                skipped: data.result.skipped,
                total: data.total,
              })}
            </span>
          </div>
        </header>

        <ol className='mx-auto mt-8 max-w-2xl list-none p-0'>
          {data.items.map((item) => (
            <li key={item.id} className='border-b border-border py-4 last:border-b-0'>
              <p className='m-0 text-xs text-muted-foreground'>
                {t('itemPosition', { position: item.position + 1 })} · {item.contentType === 'theory' ? t('typeTheory') : t('typeExercise')}
              </p>
              <p className='mt-1 text-sm text-foreground'>{item.label === '[Deleted]' ? t('deleted') : item.label}</p>
              <div className='mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs'>
                {item.topics.length > 0 ? <TopicList className='text-secondary-foreground' topics={item.topics} /> : null}
                {item.status === 'skipped' ? (
                  <span className='text-muted-foreground'>{t('skipped')}</span>
                ) : item.result ? (
                  <span className={attemptResultClassName(item.result)}>{t(resultLabelKey(item.result))}</span>
                ) : null}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </AppShell>
  );
}
