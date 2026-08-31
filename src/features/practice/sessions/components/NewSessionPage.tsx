'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import AppShell from '@/common/components/AppShell';
import BackLink from '@/common/components/BackLink';
import PageLoadError from '@/common/components/PageLoadError';
import TopicsPickerField from '@/common/components/TopicsPickerField';
import { primaryButtonClassName, secondaryButtonClassName } from '@/common/styles/form';
import { invalidatePracticeSessions } from '@/features/practice/api/invalidate-caches';
import { createSession } from '@/features/practice/sessions/api/mutations';
import { sessionSetupQueryOptions } from '@/features/practice/sessions/api/queries';
import type { ContentFilter } from '@/features/practice/sessions/api/contracts';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/cn';

export default function NewSessionPage() {
  const t = useTranslations('NewSessionPage');
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data, isPending, isError, refetch, isFetching } = useQuery(sessionSetupQueryOptions);

  const [allTopics, setAllTopics] = useState(true);
  const [selectedTopicIds, setSelectedTopicIds] = useState<string[]>([]);
  const [contentFilter, setContentFilter] = useState<ContentFilter>('all');

  const topicIds = data?.topics.map((topic) => topic.id) ?? [];

  const pickerSelectedIds = useMemo(() => {
    if (allTopics) return topicIds;
    return selectedTopicIds;
  }, [allTopics, selectedTopicIds, topicIds]);

  const { mutate: startSession, isPending: isStarting } = useMutation({
    mutationFn: () =>
      createSession({
        topicIds: allTopics ? [] : selectedTopicIds,
        contentFilter,
      }),
    onSuccess: async (response) => {
      await invalidatePracticeSessions(queryClient);
      router.push(`/practice/sessions/${response.id}`);
    },
  });

  const toggleTopic = (topicId: string) => {
    if (allTopics) {
      setAllTopics(false);
      setSelectedTopicIds(topicIds.filter((id) => id !== topicId));
      return;
    }

    const next = selectedTopicIds.includes(topicId) ? selectedTopicIds.filter((id) => id !== topicId) : [...selectedTopicIds, topicId];
    setSelectedTopicIds(next);
    setAllTopics(topicIds.length > 0 && next.length === topicIds.length);
  };

  if (isPending) {
    return (
      <AppShell>
        <div className='px-4 py-8 md:px-8'>
          <div className='h-6 w-40 animate-pulse rounded-sm bg-card-muted' />
        </div>
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

  const canStart = allTopics || selectedTopicIds.length > 0 || data.topics.length === 0;

  return (
    <AppShell>
      <div className='px-4 py-8 md:px-8'>
        <BackLink href='/practice' label={t('cancel')} />

        <header className='mt-4 border-b border-border pb-6'>
          <h1 className='m-0 text-lg font-medium text-foreground'>{t('title')}</h1>
          <p className='mt-1 max-w-2xl text-sm text-muted-foreground'>{t('description')}</p>
        </header>

        <div className='mx-auto mt-8 max-w-2xl space-y-6'>
          {data.topics.length > 0 ? (
            <div>
              <label className='mb-3 flex cursor-pointer items-center gap-2 text-sm text-foreground'>
                <input
                  type='checkbox'
                  className='size-3.5 cursor-pointer accent-primary'
                  checked={allTopics}
                  onChange={(event) => {
                    setAllTopics(event.target.checked);
                    setSelectedTopicIds(event.target.checked ? topicIds : []);
                  }}
                />
                {t('allTopics')}
              </label>

              <TopicsPickerField
                topics={data.topics}
                selectedIds={pickerSelectedIds}
                onToggle={toggleTopic}
                labels={{
                  fieldLabel: t('topicsLabel'),
                  searchLabel: t('searchTopics'),
                  searchPlaceholder: t('searchTopicsPlaceholder'),
                  noTopicsMessage: t('noTopicsAvailable'),
                  noResultsMessage: t('noTopicResults'),
                }}
              />
            </div>
          ) : (
            <p className='m-0 text-sm text-muted-foreground'>{t('noTopicsAvailable')}</p>
          )}

          <fieldset className='m-0 mb-6 border-0 p-0'>
            <legend className='mb-2 block text-xs text-secondary-foreground'>{t('contentFilterLabel')}</legend>
            <div className='flex flex-col gap-2 sm:flex-row sm:gap-6'>
              {(
                [
                  ['all', 'allContent'],
                  ['theory', 'theoryOnly'],
                  ['exercises', 'exercisesOnly'],
                ] as const
              ).map(([value, labelKey]) => (
                <label key={value} className='flex cursor-pointer items-center gap-2 text-sm text-foreground'>
                  <input
                    type='radio'
                    name='contentFilter'
                    className='size-3.5 cursor-pointer accent-primary'
                    checked={contentFilter === value}
                    onChange={() => setContentFilter(value)}
                  />
                  {t(labelKey)}
                </label>
              ))}
            </div>
          </fieldset>

          <div className='flex flex-col-reverse gap-2 border-t border-border pt-6 sm:flex-row sm:justify-end'>
            <Link href='/practice' className={cn(secondaryButtonClassName, 'text-center')}>
              {t('cancel')}
            </Link>
            <button type='button' className={primaryButtonClassName} disabled={!canStart || isStarting} onClick={() => startSession()}>
              {isStarting ? t('starting') : t('startSession')}
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
