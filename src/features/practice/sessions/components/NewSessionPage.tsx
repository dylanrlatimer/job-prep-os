'use client';

import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import AppShell from '@/common/components/AppShell';
import BackLink from '@/common/components/BackLink';
import PageLoadError from '@/common/components/PageLoadError';
import { useDebouncedValue } from '@/common/hooks/use-debounced-value';
import { inputClassName, primaryButtonClassName, secondaryButtonClassName } from '@/common/styles/form';
import { invalidatePracticeSessions } from '@/features/practice/api/invalidate-caches';
import { createSession } from '@/features/practice/sessions/api/mutations';
import { sessionPreviewQueryOptions, sessionSetupQueryOptions } from '@/features/practice/sessions/api/queries';
import type { CreateSessionInput, SessionSetupTopic } from '@/features/practice/sessions/api/contracts';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/cn';
import SessionTopicAllocator from './SessionTopicAllocator';

function expectedExercises(requested: number, exerciseRatio: number) {
  return Math.round((requested * exerciseRatio) / 100);
}

export default function NewSessionPage() {
  const t = useTranslations('NewSessionPage');
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data, isPending, isError, refetch, isFetching } = useQuery(sessionSetupQueryOptions);

  const [exerciseRatio, setExerciseRatio] = useState<number | null>(null);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [applyAllValue, setApplyAllValue] = useState(10);

  useEffect(() => {
    if (!data) {
      return;
    }

    setExerciseRatio((current) => (current === null ? data.exerciseRatio : current));
    setCounts((current) => {
      const next: Record<string, number> = {};
      for (const topic of data.topics) {
        const max = topic.theoryCount + topic.exerciseCount;
        next[topic.id] = Math.min(current[topic.id] ?? 0, max);
      }
      return next;
    });
  }, [data]);

  const allocations = useMemo(
    () =>
      Object.entries(counts)
        .filter(([, count]) => count > 0)
        .map(([topicId, count]) => ({ topicId, count })),
    [counts],
  );

  const previewInput = useMemo<CreateSessionInput | null>(() => {
    if (exerciseRatio === null || allocations.length === 0) {
      return null;
    }

    return { exerciseRatio, topics: allocations };
  }, [allocations, exerciseRatio]);

  const debouncedPreviewInput = useDebouncedValue(previewInput, 200);
  const previewQuery = useQuery(sessionPreviewQueryOptions(debouncedPreviewInput));

  const { mutate: startSession, isPending: isStarting } = useMutation({
    mutationFn: () => {
      if (!previewInput) {
        throw new Error('noTopicsSelected');
      }

      return createSession(previewInput);
    },
    onSuccess: async (response) => {
      await invalidatePracticeSessions(queryClient);
      router.push(`/practice/sessions/${response.id}`);
    },
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

  const mix = exerciseRatio ?? data.exerciseRatio;
  const preview = previewQuery.data;
  const canStart = allocations.length > 0 && (preview?.total ?? 0) > 0;
  const startBlocked = !canStart || isStarting || (previewQuery.isFetching && !preview);

  const topicById = new Map(data.topics.map((topic) => [topic.id, topic]));
  const shortfalls =
    preview?.topics.flatMap((fill) => {
      const topic = topicById.get(fill.topicId);
      if (!topic) {
        return [];
      }

      if (fill.filled !== fill.requested) {
        return [t('shortfallCount', { name: topic.name, filled: fill.filled, requested: fill.requested })];
      }

      if (fill.exercises !== expectedExercises(fill.requested, mix)) {
        return [t('shortfallMix', { name: topic.name, exercises: fill.exercises, questions: fill.theory })];
      }

      return [];
    }) ?? [];

  const applyToAll = () => {
    const next: Record<string, number> = {};
    for (const topic of data.topics) {
      next[topic.id] = Math.min(applyAllValue, topic.theoryCount + topic.exerciseCount);
    }
    setCounts(next);
  };

  return (
    <AppShell>
      <div className='px-4 py-8 md:px-8'>
        <BackLink href='/practice' label={t('cancel')} />

        <header className='mt-4 border-b border-border pb-6'>
          <h1 className='m-0 text-lg font-medium text-foreground'>{t('title')}</h1>
          <p className='mt-1 max-w-2xl text-sm text-muted-foreground'>{t('description')}</p>
        </header>

        <div className='mx-auto mt-8 max-w-2xl space-y-6'>
          <label className='block'>
            <span className='mb-1.5 block text-xs text-secondary-foreground'>{t('mixLabel')}</span>
            <input
              className={cn(inputClassName, 'w-24')}
              type='number'
              min={0}
              max={100}
              step={1}
              value={mix}
              onChange={(event) => {
                const next = Number(event.target.value);
                if (!Number.isFinite(next)) {
                  return;
                }
                setExerciseRatio(Math.min(100, Math.max(0, Math.round(next))));
              }}
            />
            <span className='mt-1.5 block text-xs text-muted-foreground'>{t('mixHint', { questions: 100 - mix })}</span>
          </label>

          <SessionTopicAllocator
            topics={data.topics}
            counts={counts}
            onCountChange={(topicId, count) => {
              setCounts((current) => ({ ...current, [topicId]: count }));
            }}
            labels={{
              fieldLabel: t('topicsLabel'),
              searchLabel: t('searchTopics'),
              searchPlaceholder: t('searchTopicsPlaceholder'),
              noTopicsMessage: t('noTopicsAvailable'),
              noResultsMessage: t('noTopicResults'),
              inventory: (topic: SessionSetupTopic) => t('inventory', { questions: topic.theoryCount, exercises: topic.exerciseCount }),
            }}
          />

          {data.topics.length > 0 ? (
            <div className='flex flex-wrap items-center gap-2'>
              <input
                className={cn(inputClassName, 'w-16 px-2 py-1 text-right')}
                type='number'
                min={0}
                max={200}
                step={1}
                value={applyAllValue}
                onChange={(event) => {
                  const next = Number(event.target.value);
                  if (!Number.isFinite(next)) {
                    return;
                  }
                  setApplyAllValue(Math.min(200, Math.max(0, Math.round(next))));
                }}
                aria-label={t('applyToAllLabel')}
              />
              <button type='button' className={secondaryButtonClassName} onClick={applyToAll}>
                {t('applyToAll')}
              </button>
            </div>
          ) : null}

          <div className='space-y-1 text-sm text-muted-foreground'>
            <p className='m-0'>
              {preview ? t('previewSummary', { total: preview.total, exercises: preview.exercises, questions: preview.theory }) : t('previewEmpty')}
            </p>
            {shortfalls.map((line) => (
              <p key={line} className='m-0 text-xs'>
                {line}
              </p>
            ))}
          </div>

          <div className='flex flex-col-reverse gap-2 border-t border-border pt-6 sm:flex-row sm:justify-end'>
            <Link href='/practice' className={cn(secondaryButtonClassName, 'text-center')}>
              {t('cancel')}
            </Link>
            <button type='button' className={primaryButtonClassName} disabled={startBlocked} onClick={() => startSession()}>
              {isStarting ? t('starting') : t('startSession')}
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
