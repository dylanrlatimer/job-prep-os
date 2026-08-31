'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import AppShell from '@/common/components/AppShell';
import ListPageLayout, { ListEmptyState } from '@/common/components/ListPageLayout';
import ListPageSkeleton from '@/common/components/ListPageSkeleton';
import PageLoadError from '@/common/components/PageLoadError';
import Select from '@/common/components/Select';
import TopicIcon from '@/common/components/TopicIcon';
import AdminGate from '@/features/admin/components/AdminGate';
import { matchesText } from '@/common/lib/list-filters';
import { adminTopicsQueryOptions } from '@/features/admin/topics/api/queries';
import type { AdminTopicItem } from '@/features/admin/topics/api/contracts';
import { inputClassName, primaryButtonClassName, secondaryButtonClassName } from '@/common/styles/form';
import { cn } from '@/lib/cn';

type StatusFilter = 'all' | 'active' | 'disabled';

function matchesStatus(topic: AdminTopicItem, status: StatusFilter) {
  if (status === 'all') return true;
  if (status === 'active') return topic.isActive;
  return !topic.isActive;
}

export default function AdminTopicsPage() {
  const t = useTranslations('AdminTopicsPage');

  return (
    <AdminGate forbiddenMessage={t('forbidden')}>
      <AdminTopicsContent />
    </AdminGate>
  );
}

function AdminTopicsContent() {
  const t = useTranslations('AdminTopicsPage');
  const { data, isPending, isError, refetch, isFetching } = useQuery(adminTopicsQueryOptions);

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');

  const filteredTopics = useMemo(() => {
    if (!data) return [];
    return data.topics.filter((topic) => (matchesText(topic.name, search) || matchesText(topic.slug, search)) && matchesStatus(topic, status));
  }, [data, search, status]);

  const statusOptions = useMemo(
    () => [
      { value: 'all', label: t('allStatuses') },
      { value: 'active', label: t('active') },
      { value: 'disabled', label: t('disabled') },
    ],
    [t],
  );

  if (isPending) {
    return (
      <AppShell>
        <ListPageSkeleton />
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

  const isEmpty = data.topics.length === 0;
  const hasNoMatches = !isEmpty && filteredTopics.length === 0;

  return (
    <AppShell>
      <ListPageLayout
        title={t('title')}
        description={t('description')}
        headerActions={
          <Link href='/admin/topics/new' className={cn(primaryButtonClassName, 'shrink-0 self-start')}>
            {t('createTopic')}
          </Link>
        }
        filters={
          isEmpty ? undefined : (
            <div className='mt-6 flex flex-col gap-3 sm:flex-row sm:items-center'>
              <label className='block flex-1'>
                <span className='sr-only'>{t('searchLabel')}</span>
                <input
                  className={inputClassName}
                  type='search'
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder={t('searchPlaceholder')}
                />
              </label>

              <Select
                className='w-full sm:w-44'
                aria-label={t('statusFilterLabel')}
                value={status}
                onValueChange={(value) => setStatus(value as StatusFilter)}
                options={statusOptions}
              />
            </div>
          )
        }
        countLabel={isEmpty ? t('topicCountEmpty') : t('topicCount', { count: data.topics.length })}>
        {isEmpty ? (
          <ListEmptyState title={t('emptyTitle')} description={t('emptyDescription')}>
            <Link href='/admin/topics/new' className={cn(primaryButtonClassName, 'mt-4 inline-flex')}>
              {t('createTopic')}
            </Link>
          </ListEmptyState>
        ) : hasNoMatches ? (
          <ListEmptyState title={t('noMatchesTitle')} description={t('noMatchesDescription')} />
        ) : (
          <ul className='m-0 list-none p-0'>
            {filteredTopics.map((topic) => (
              <li key={topic.id} className='border-b border-border py-4 last:border-b-0'>
                <div className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
                  <div className='min-w-0 flex-1'>
                    <p className='m-0 flex items-center text-sm leading-relaxed text-foreground'>
                      <TopicIcon iconKey={topic.iconKey} className='mr-2' />
                      {topic.name}
                    </p>
                    <div className='mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs'>
                      <span className={topic.isActive ? 'text-success' : 'text-muted-foreground'}>{topic.isActive ? t('active') : t('disabled')}</span>
                      <span className='text-muted-foreground'>{t('questionCount', { count: topic.questionCount })}</span>
                      <span className='text-muted-foreground'>{t('exerciseCount', { count: topic.exerciseCount })}</span>
                    </div>
                  </div>

                  <Link href={`/admin/topics/${topic.id}/edit`} className={cn(secondaryButtonClassName, 'shrink-0 self-start sm:ml-4')}>
                    {t('edit')}
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
