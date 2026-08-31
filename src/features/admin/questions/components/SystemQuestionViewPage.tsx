'use client';

import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import AppShell from '@/common/components/AppShell';
import BackLink from '@/common/components/BackLink';
import PageLoadError from '@/common/components/PageLoadError';
import SourceCitation from '@/common/components/SourceCitation';
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
      <PageLoadError
        title={t('title')}
        message={t('viewLoadError')}
        onRetry={() => refetch()}
        isRetrying={isFetching}
        retryLabel={t('retry')}
        retryingLabel={t('retrying')}
      />
    );
  }

  return (
    <AppShell>
      <div className='px-4 py-8 md:px-8'>
        <BackLink href='/admin/questions' label={t('backToList')} />

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
                <SourceCitation name={data.sourceName} url={data.sourceUrl} />
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
