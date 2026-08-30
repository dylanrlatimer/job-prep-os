'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import AppShell from '@/common/components/AppShell';
import TopicList from '@/common/components/TopicList';
import { invalidateBrowseCaches } from '@/features/admin/api/invalidate-admin-caches';
import { saveBrowseQuestion } from '@/features/theory/browse/api/mutations';
import { browseQuestionDetailQueryOptions } from '@/features/theory/browse/api/queries';
import QuestionDetailSkeleton from '@/features/theory/detail/components/QuestionDetailSkeleton';
import TiptapRenderer from '@/common/components/TiptapRenderer';
import { primaryButtonClassName, secondaryButtonClassName } from '@/common/styles/form';
import { useToastStore } from '@/lib/store/use-toast-store';
import { cn } from '@/lib/cn';

type BrowseQuestionDetailPageProps = {
  questionId: string;
};

export default function BrowseQuestionDetailPage({ questionId }: BrowseQuestionDetailPageProps) {
  const t = useTranslations('BrowseQuestionDetailPage');
  const tBrowse = useTranslations('BrowsePage');
  const tDetail = useTranslations('QuestionDetailPage');
  const queryClient = useQueryClient();
  const { data, isPending, isError, refetch, isFetching } = useQuery(browseQuestionDetailQueryOptions(questionId));

  const { mutate: saveQuestion, isPending: isSaving } = useMutation({
    mutationFn: () => saveBrowseQuestion(questionId),
    onSuccess: async () => {
      await invalidateBrowseCaches(queryClient, questionId);
      useToastStore.getState().addToast(tBrowse('saveQuestionSuccess'), 'success');
    },
  });

  if (isPending) {
    return (
      <AppShell>
        <QuestionDetailSkeleton />
      </AppShell>
    );
  }

  if (isError || !data) {
    return (
      <AppShell>
        <div className='px-4 py-8 md:px-8'>
          <h1 className='m-0 text-lg font-medium text-foreground'>{tDetail('title')}</h1>
          <p className='mt-2 text-sm text-muted-foreground'>{t('loadError')}</p>
          <button type='button' className={cn(secondaryButtonClassName, 'mt-4')} onClick={() => refetch()} disabled={isFetching}>
            {isFetching ? tDetail('retrying') : tDetail('retry')}
          </button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className='px-4 py-8 md:px-8'>
        <Link href='/browse' className='inline-flex items-center gap-1 text-sm text-muted-foreground no-underline transition-colors hover:text-foreground'>
          <ChevronLeft size={16} strokeWidth={1.75} aria-hidden='true' />
          {t('backToBrowse')}
        </Link>

        <header className='mt-4 border-b border-border pb-6'>
          <div className='flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between'>
            <div className='min-w-0 flex-1'>
              <h1 className='m-0 text-lg font-medium leading-relaxed text-foreground'>{data.question}</h1>

              <div className='mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs'>
                {data.isSystem ? <span className='text-secondary-foreground'>{tBrowse('appLabel')}</span> : null}
                {data.topics.length > 0 ? (
                  <TopicList className='text-secondary-foreground' topics={data.topics} />
                ) : (
                  <span className='text-muted-foreground'>{tDetail('noTopics')}</span>
                )}

                {data.sourceName ? (
                  <span className='text-secondary-foreground'>
                    {data.sourceUrl ? (
                      <a href={data.sourceUrl} target='_blank' rel='noopener noreferrer' className='text-link underline-offset-2 hover:underline'>
                        {data.sourceName}
                      </a>
                    ) : (
                      data.sourceName
                    )}
                  </span>
                ) : null}

                {data.isSaved ? <span className='text-muted-foreground'>{tBrowse('saved')}</span> : null}
              </div>
            </div>

            <div className='flex shrink-0 flex-wrap gap-2'>
              {data.isSaved ? (
                <Link href={`/theory/${questionId}/practice`} className={primaryButtonClassName}>
                  {tDetail('practice')}
                </Link>
              ) : (
                <button type='button' className={primaryButtonClassName} onClick={() => saveQuestion()} disabled={isSaving}>
                  {isSaving ? tBrowse('saving') : tBrowse('addQuestionToRepository')}
                </button>
              )}
            </div>
          </div>
        </header>

        <div className='mx-auto mt-8 max-w-2xl'>
          <section>
            <h2 className='m-0 text-xs text-secondary-foreground'>{tDetail('referenceAnswerLabel')}</h2>
            <TiptapRenderer content={data.answer} className='mt-2' />
          </section>
        </div>
      </div>
    </AppShell>
  );
}
