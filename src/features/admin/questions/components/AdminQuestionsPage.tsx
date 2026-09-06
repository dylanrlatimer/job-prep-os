'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import AppShell from '@/common/components/AppShell';
import ListPageLayout, { ListEmptyState } from '@/common/components/ListPageLayout';
import ListPageSkeleton from '@/common/components/ListPageSkeleton';
import ListPagination from '@/common/components/ListPagination';
import PageLoadError from '@/common/components/PageLoadError';
import Select from '@/common/components/Select';
import TopicList from '@/common/components/TopicList';
import AdminGate from '@/features/admin/components/AdminGate';
import { type PublicationFilter } from '@/common/lib/list-filters';
import { useClampListQuery, useListQueryState } from '@/common/hooks/use-list-query-state';
import { systemQuestionsQueryOptions } from '@/features/admin/questions/api/queries';
import { SystemQuestionListQuerySchema } from '@/features/admin/questions/api/contracts';
import { inputClassName, primaryButtonClassName, secondaryButtonClassName } from '@/common/styles/form';
import { cn } from '@/lib/cn';

export default function AdminQuestionsPage() {
  const t = useTranslations('AdminQuestionsPage');

  return (
    <AdminGate forbiddenMessage={t('forbidden')}>
      <AdminQuestionsContent />
    </AdminGate>
  );
}

function AdminQuestionsContent() {
  const t = useTranslations('AdminQuestionsPage');
  const { query, setQuery, setPage, searchInput, setSearchInput } = useListQueryState(SystemQuestionListQuerySchema);
  const { data, isPending, isError, refetch, isFetching } = useQuery(systemQuestionsQueryOptions(query));
  useClampListQuery(query.page, data?.totalCount, setPage);

  const topicOptions = useMemo(() => {
    if (!data) return [{ value: '', label: t('allTopics') }];
    return [{ value: '', label: t('allTopics') }, ...data.topics.map((topic) => ({ value: topic.id, label: topic.name }))];
  }, [data, t]);

  const publicationOptions = useMemo(
    () => [
      { value: 'all', label: t('allPublication') },
      { value: 'published', label: t('published') },
      { value: 'draft', label: t('draft') },
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

  if ((isError && !data) || !data) {
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

  const isEmpty = data.unfilteredCount === 0;
  const hasNoMatches = !isEmpty && data.totalCount === 0;

  return (
    <AppShell>
      <ListPageLayout
        title={t('title')}
        description={t('description')}
        headerActions={
          <Link href='/admin/questions/new' className={cn(primaryButtonClassName, 'shrink-0 self-start')}>
            {t('createQuestion')}
          </Link>
        }
        filters={
          isEmpty ? undefined : (
            <div className='mt-6 flex flex-col gap-3 lg:flex-row lg:items-center'>
              <label className='block flex-1'>
                <span className='sr-only'>{t('searchLabel')}</span>
                <input
                  className={inputClassName}
                  type='search'
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  placeholder={t('searchPlaceholder')}
                />
              </label>

              {data.topics.length > 0 && (
                <Select
                  className='w-full lg:w-44'
                  aria-label={t('topicFilterLabel')}
                  value={query.topicId ?? ''}
                  onValueChange={(value) => setQuery({ topicId: value || undefined })}
                  options={topicOptions}
                />
              )}

              <Select
                className='w-full lg:w-44'
                aria-label={t('publicationFilterLabel')}
                value={query.publication}
                onValueChange={(value) => setQuery({ publication: value as PublicationFilter })}
                options={publicationOptions}
              />
            </div>
          )
        }
        countLabel={isEmpty ? t('questionCountEmpty') : t('questionCount', { count: data.totalCount })}
        footer={hasNoMatches || isEmpty ? undefined : <ListPagination page={query.page} totalCount={data.totalCount} onPageChange={setPage} />}>
        {isEmpty ? (
          <ListEmptyState title={t('emptyTitle')} description={t('emptyDescription')}>
            <Link href='/admin/questions/new' className={cn(primaryButtonClassName, 'mt-4 inline-flex')}>
              {t('createQuestion')}
            </Link>
          </ListEmptyState>
        ) : hasNoMatches ? (
          <ListEmptyState title={t('noMatchesTitle')} description={t('noMatchesDescription')} />
        ) : (
          <ul className='m-0 list-none p-0'>
            {data.questions.map((question) => (
              <li key={question.id} className='border-b border-border py-4 last:border-b-0'>
                <div className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
                  <div className='min-w-0 flex-1'>
                    <Link href={`/admin/questions/${question.id}`} className='text-sm leading-relaxed text-foreground no-underline hover:underline'>
                      {question.question}
                    </Link>
                    <div className='mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs'>
                      <span className={question.isPublic ? 'text-success' : 'text-muted-foreground'}>{question.isPublic ? t('published') : t('draft')}</span>
                      {question.topics.length > 0 ? (
                        <TopicList className='text-secondary-foreground' topics={question.topics} />
                      ) : (
                        <span className='text-muted-foreground'>{t('noTopics')}</span>
                      )}
                    </div>
                  </div>

                  <Link href={`/admin/questions/${question.id}/edit`} className={cn(secondaryButtonClassName, 'shrink-0 self-start sm:ml-4')}>
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
