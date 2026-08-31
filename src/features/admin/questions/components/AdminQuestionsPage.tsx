'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import AppShell from '@/common/components/AppShell';
import Select from '@/common/components/Select';
import TopicList from '@/common/components/TopicList';
import AdminGate from '@/features/admin/components/AdminGate';
import { systemQuestionsQueryOptions } from '@/features/admin/questions/api/queries';
import type { SystemQuestionListItem } from '@/features/admin/questions/api/contracts';
import { inputClassName, primaryButtonClassName, secondaryButtonClassName } from '@/common/styles/form';
import TheoryRepositorySkeleton from '@/features/theory/repository/components/TheoryRepositorySkeleton';
import { cn } from '@/lib/cn';

function matchesSearch(question: SystemQuestionListItem, search: string) {
  if (!search) return true;
  return question.question.toLowerCase().includes(search.toLowerCase());
}

function matchesTopic(question: SystemQuestionListItem, topicId: string | null) {
  if (!topicId) return true;
  return question.topics.some((topic) => topic.id === topicId);
}

function matchesPublication(question: SystemQuestionListItem, publication: 'all' | 'published' | 'draft') {
  if (publication === 'all') return true;
  if (publication === 'published') return question.isPublic;
  return !question.isPublic;
}

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
  const [publication, setPublication] = useState<'all' | 'published' | 'draft'>('all');

  const filteredQuestions = useMemo(() => {
    if (!data) return [];
    return data.questions.filter((question) => matchesSearch(question, search) && matchesTopic(question, topicId) && matchesPublication(question, publication));
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
        <TheoryRepositorySkeleton />
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

  const isEmpty = data.questions.length === 0;
  const hasNoMatches = !isEmpty && filteredQuestions.length === 0;

  return (
    <AppShell>
      <div className='px-4 py-8 md:px-8'>
        <header className='border-b border-border pb-6'>
          <div className='flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between'>
            <div className='min-w-0'>
              <h1 className='m-0 text-lg font-medium text-foreground'>{t('title')}</h1>
              <p className='mt-1 max-w-2xl text-sm text-muted-foreground'>{t('description')}</p>
            </div>

            <Link href='/admin/questions/new' className={cn(primaryButtonClassName, 'shrink-0 self-start')}>
              {t('createQuestion')}
            </Link>
          </div>
        </header>

        {!isEmpty && (
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
              onValueChange={(value) => setPublication(value as 'all' | 'published' | 'draft')}
              options={publicationOptions}
            />
          </div>
        )}

        <p className='mt-4 border-b border-border pb-4 text-xs text-muted-foreground'>
          {isEmpty ? t('questionCountEmpty') : t('questionCount', { count: data.questions.length })}
        </p>

        {isEmpty ? (
          <div className='py-12'>
            <p className='m-0 text-sm text-foreground'>{t('emptyTitle')}</p>
            <p className='mt-1 text-sm text-muted-foreground'>{t('emptyDescription')}</p>
            <Link href='/admin/questions/new' className={cn(primaryButtonClassName, 'mt-4 inline-flex')}>
              {t('createQuestion')}
            </Link>
          </div>
        ) : hasNoMatches ? (
          <div className='py-12'>
            <p className='m-0 text-sm text-foreground'>{t('noMatchesTitle')}</p>
            <p className='mt-1 text-sm text-muted-foreground'>{t('noMatchesDescription')}</p>
          </div>
        ) : (
          <ul className='m-0 list-none p-0'>
            {filteredQuestions.map((question) => (
              <li key={question.id} className='border-b border-border py-4 last:border-b-0'>
                <div className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
                  <div className='min-w-0 flex-1'>
                    <Link
                      href={`/admin/questions/${question.id}`}
                      className='text-sm leading-relaxed text-foreground no-underline hover:underline'>
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
      </div>
    </AppShell>
  );
}
