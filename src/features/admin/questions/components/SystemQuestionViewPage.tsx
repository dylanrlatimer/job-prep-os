'use client';

import { useQuery } from '@tanstack/react-query';
import { ChevronLeft } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import AppShell from '@/common/components/AppShell';
import TopicList from '@/common/components/TopicList';
import TiptapRenderer from '@/common/components/TiptapRenderer';
import AdminGate from '@/features/admin/components/AdminGate';
import { systemQuestionQueryOptions } from '@/features/admin/questions/api/queries';
import QuestionDetailSkeleton from '@/features/theory/detail/components/QuestionDetailSkeleton';
import { secondaryButtonClassName } from '@/common/styles/form';
import { cn } from '@/lib/cn';

type SystemQuestionViewPageProps = {
  questionId: string;
};

export default function SystemQuestionViewPage({ questionId }: SystemQuestionViewPageProps) {
  const t = useTranslations('AdminQuestionsPage');

  return (
    <AdminGate forbiddenMessage={t('forbidden')}>
      <SystemQuestionViewContent questionId={questionId} />
    </AdminGate>
  );
}

function SystemQuestionViewContent({ questionId }: SystemQuestionViewPageProps) {
  const t = useTranslations('AdminQuestionsPage');
  const tDetail = useTranslations('QuestionDetailPage');
  const { data, isPending, isError, refetch, isFetching } = useQuery(systemQuestionQueryOptions(questionId));

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
          <h1 className='m-0 text-lg font-medium text-foreground'>{t('title')}</h1>
          <p className='mt-2 text-sm text-muted-foreground'>{t('viewLoadError')}</p>
          <button type='button' className={cn(secondaryButtonClassName, 'mt-4')} onClick={() => refetch()} disabled={isFetching}>
            {isFetching ? t('retrying') : t('retry')}
          </button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className='px-4 py-8 md:px-8'>
        <Link
          href='/admin/questions'
          className='inline-flex items-center gap-1 text-sm text-muted-foreground no-underline transition-colors hover:text-foreground'>
          <ChevronLeft size={16} strokeWidth={1.75} aria-hidden='true' />
          {t('backToList')}
        </Link>

        <header className='mt-4 border-b border-border pb-6'>
          <div className='flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between'>
            <div className='min-w-0 flex-1'>
              <h1 className='m-0 text-lg font-medium leading-relaxed text-foreground'>{data.question}</h1>

              <div className='mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs'>
                <span className={data.isPublic ? 'text-success' : 'text-muted-foreground'}>{data.isPublic ? t('published') : t('draft')}</span>
                {data.topics.length > 0 ? (
                  <TopicList className='text-secondary-foreground' topics={data.topics} />
                ) : (
                  <span className='text-muted-foreground'>{t('noTopics')}</span>
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
              </div>
            </div>

            <Link href={`/admin/questions/${questionId}/edit`} className={cn(secondaryButtonClassName, 'shrink-0 self-start')}>
              {t('edit')}
            </Link>
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
