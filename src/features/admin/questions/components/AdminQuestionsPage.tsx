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
import TopicList from '@/common/components/TopicList';
import AdminGate from '@/features/admin/components/AdminGate';
import { matchesPublication, matchesText, matchesTopic, type PublicationFilter } from '@/common/lib/list-filters';
import { systemQuestionsQueryOptions } from '@/features/admin/questions/api/queries';
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
  const { data, isPending, isError, refetch, isFetching } = useQuery(systemQuestionsQueryOptions);

  const [search, setSearch] = useState('');
  const [topicId, setTopicId] = useState<string | null>(null);
  const [publication, setPublication] = useState<PublicationFilter>('all');

  const filteredQuestions = useMemo(() => {
    if (!data) return [];
    return data.questions.filter(
      (question) => matchesText(question.question, search) && matchesTopic(question, topicId) && matchesPublication(question, publication),
    );
  }, [topicId, data, publication, search]);

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

  const isEmpty = data.questions.length === 0;
  const hasNoMatches = !isEmpty && filteredQuestions.length === 0;

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
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder={t('searchPlaceholder')}
                />
              </label>

              {data.topics.length > 0 && (
                <Select
                  className='w-full lg:w-44'
                  aria-label={t('topicFilterLabel')}
                  value={topicId ?? ''}
                  onValueChange={(value) => setTopicId(value || null)}
                  options={topicOptions}
                />
              )}

              <Select
                className='w-full lg:w-44'
                aria-label={t('publicationFilterLabel')}
                value={publication}
                onValueChange={(value) => setPublication(value as PublicationFilter)}
                options={publicationOptions}
              />
            </div>
          )
        }
        countLabel={isEmpty ? t('questionCountEmpty') : t('questionCount', { count: data.questions.length })}>
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
            {filteredQuestions.map((question) => (
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
