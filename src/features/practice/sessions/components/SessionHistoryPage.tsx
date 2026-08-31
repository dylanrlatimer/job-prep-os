'use client';

import { useQuery } from '@tanstack/react-query';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import AppShell from '@/common/components/AppShell';
import BackLink from '@/common/components/BackLink';
import ListPageLayout, { ListEmptyState } from '@/common/components/ListPageLayout';
import ListPageSkeleton from '@/common/components/ListPageSkeleton';
import PageLoadError from '@/common/components/PageLoadError';
import { completedSessionsQueryOptions } from '@/features/practice/sessions/api/queries';
import type { ContentFilter } from '@/features/practice/sessions/api/contracts';
import { formatSessionDate, sessionTopicLabel } from '@/features/practice/sessions/lib/session-title';

function contentFilterLabel(filter: ContentFilter, t: (key: string) => string) {
  if (filter === 'theory') return t('contentFilterTheory');
  if (filter === 'exercises') return t('contentFilterExercises');
  return t('contentFilterAll');
}

export default function SessionHistoryPage() {
  const t = useTranslations('SessionHistoryPage');
  const locale = useLocale();
  const { data, isPending, isError, refetch, isFetching } = useQuery(completedSessionsQueryOptions);

  const formatDate = (value: string) =>
    new Date(value).toLocaleString(locale, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });

  if (isPending) {
    return (
      <AppShell>
        <ListPageSkeleton />
      </AppShell>
    );
  }

  if (isError) {
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

  const isEmpty = data.sessions.length === 0;

  return (
    <AppShell>
      <div>
        <div className='px-4 pt-8 md:px-8'>
          <BackLink href='/practice' label={t('back')} />
        </div>
        <ListPageLayout
          title={t('title')}
          description={t('description')}
          countLabel={isEmpty ? t('sessionCountEmpty') : t('sessionCount', { count: data.sessions.length })}>
          {isEmpty ? (
            <ListEmptyState title={t('empty')} description={t('emptyDescription')} />
          ) : (
            <ul className='m-0 list-none p-0'>
              {data.sessions.map((session) => (
                <li key={session.id} className='border-b border-border py-4 last:border-b-0'>
                  <Link href={`/practice/history/${session.id}`} className='block text-sm text-foreground no-underline hover:underline'>
                    {t('sessionTitle', {
                      date: formatSessionDate(session.createdAt),
                      topics: sessionTopicLabel(session.topicNames, t('topicNamesAll')),
                    })}
                  </Link>
                  <div className='mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-secondary-foreground'>
                    <span>{formatDate(session.completedAt)}</span>
                    <span>{contentFilterLabel(session.contentFilter, t)}</span>
                    <span>
                      {t('resultTotals', {
                        incorrect: session.result.incorrect,
                        partial: session.result.partial,
                        correct: session.result.correct,
                        skipped: session.result.skipped,
                        total: session.total,
                      })}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </ListPageLayout>
      </div>
    </AppShell>
  );
}
