'use client';

import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import AppShell from '@/common/components/AppShell';
import ListPageLayout, { ListEmptyState } from '@/common/components/ListPageLayout';
import ListPageSkeleton from '@/common/components/ListPageSkeleton';
import PageLoadError from '@/common/components/PageLoadError';
import { primaryButtonClassName, secondaryButtonClassName } from '@/common/styles/form';
import { activeSessionsQueryOptions } from '@/features/practice/sessions/api/queries';
import type { ContentFilter } from '@/features/practice/sessions/api/contracts';
import { formatSessionDate, sessionTopicLabel } from '@/features/practice/sessions/lib/session-title';

function contentFilterLabel(filter: ContentFilter, t: (key: string) => string) {
  if (filter === 'theory') return t('contentFilterTheory');
  if (filter === 'exercises') return t('contentFilterExercises');
  return t('contentFilterAll');
}

export default function PracticeHomePage() {
  const t = useTranslations('PracticeHomePage');
  const { data, isPending, isError, refetch, isFetching } = useQuery(activeSessionsQueryOptions);

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
      <ListPageLayout
        title={t('title')}
        description={t('description')}
        headerActions={
          <div className='flex shrink-0 flex-wrap gap-2'>
            <Link href='/practice/history' className={secondaryButtonClassName}>
              {t('viewHistory')}
            </Link>
            <Link href='/practice/new' className={primaryButtonClassName}>
              {t('newSession')}
            </Link>
          </div>
        }
        countLabel={isEmpty ? t('sessionCountEmpty') : t('sessionCount', { count: data.sessions.length })}>
        {isEmpty ? (
          <ListEmptyState title={t('noActiveSessions')} description={t('noActiveSessionsDescription')}>
            <div className='mt-4 flex flex-wrap gap-2'>
              <Link href='/practice/new' className={primaryButtonClassName}>
                {t('newSession')}
              </Link>
            </div>
          </ListEmptyState>
        ) : (
          <ul className='m-0 list-none p-0'>
            {data.sessions.map((session) => (
              <li key={session.id} className='border-b border-border py-4 last:border-b-0'>
                <div className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
                  <div className='min-w-0 flex-1'>
                    <p className='m-0 text-sm text-foreground'>
                      {t('sessionTitle', {
                        date: formatSessionDate(session.createdAt),
                        topics: sessionTopicLabel(session.topicNames, t('topicNamesAll')),
                      })}
                    </p>
                    <div className='mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-secondary-foreground'>
                      <span>{contentFilterLabel(session.contentFilter, t)}</span>
                      <span>{t('progress', { answered: session.progress.answered, total: session.progress.total })}</span>
                    </div>
                  </div>
                  <Link href={`/practice/sessions/${session.id}`} className={primaryButtonClassName}>
                    {t('resume')}
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </ListPageLayout>
    </AppShell>
  );
}
