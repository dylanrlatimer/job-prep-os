'use client';

import type { SubmitEvent } from 'react';
import { useRef } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import AppShell from '@/common/components/AppShell';
import BackLink from '@/common/components/BackLink';
import Field from '@/common/components/Field';
import PageLoadError from '@/common/components/PageLoadError';
import AdminGate from '@/features/admin/components/AdminGate';
import Select from '@/common/components/Select';
import TopicIcon from '@/common/components/TopicIcon';
import { destructiveButtonClassName, inputClassName, primaryButtonClassName, secondaryButtonClassName } from '@/common/styles/form';
import { isTopicIconKey, TOPIC_ICON_KEYS, TOPIC_ICON_LABELS } from '@/common/topics/icon-keys';
import { topicBuilderFieldOrder, useTopicBuilderForm } from '@/features/admin/topics/hooks/useTopicBuilderForm';
import { hardcoded } from '@/utils/hardcoded';
import { scrollToFirstFormError } from '@/common/lib/scroll-to-first-form-error';
import { cn } from '@/lib/cn';

type TopicBuilderPageProps = {
  topicId?: string;
};

export default function TopicBuilderPage({ topicId }: TopicBuilderPageProps) {
  const t = useTranslations('AdminTopicBuilderPage');

  return (
    <AdminGate forbiddenMessage={t('forbidden')}>
      <TopicBuilderContent topicId={topicId} />
    </AdminGate>
  );
}

function TopicBuilderContent({ topicId }: TopicBuilderPageProps) {
  const t = useTranslations('AdminTopicBuilderPage');
  const formRef = useRef<HTMLFormElement>(null);
  const {
    isEdit,
    values,
    fieldErrors,
    status,
    slug,
    questionCount,
    exerciseCount,
    isLoading,
    isError,
    isSubmitting,
    isDeleting,
    submit,
    setField,
    remove,
    refetch,
  } = useTopicBuilderForm({ topicId });

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    const result = submit();

    if (!result.ok) {
      scrollToFirstFormError(result.fieldErrors, topicBuilderFieldOrder, formRef.current ?? document);
    }
  };

  if (isLoading || status === 'loading') {
    return (
      <AppShell>
        <div className='px-4 py-8 md:px-8'>
          <div className='h-6 w-40 animate-pulse rounded-sm bg-card-muted' />
        </div>
      </AppShell>
    );
  }

  if (isError) {
    return <PageLoadError title={isEdit ? t('editTitle') : t('createTitle')} message={t('loadError')} onRetry={refetch} retryLabel={t('retry')} />;
  }

  const canDelete = isEdit && questionCount === 0 && exerciseCount === 0;
  const iconOptions = [
    { value: '', label: t('iconNone') },
    ...TOPIC_ICON_KEYS.map((key) => ({
      value: key,
      label: hardcoded(TOPIC_ICON_LABELS[key]),
      icon: <TopicIcon iconKey={key} />,
    })),
  ];

  return (
    <AppShell>
      <div className='px-4 py-8 md:px-8'>
        <BackLink href='/admin/topics' label={t('backToList')} />

        <header className='mt-4 border-b border-border pb-6'>
          <h1 className='m-0 text-lg font-medium text-foreground'>{isEdit ? t('editTitle') : t('createTitle')}</h1>
          <p className='mt-1 max-w-2xl text-sm text-muted-foreground'>{isEdit ? t('editDescription') : t('createDescription')}</p>
        </header>

        <form ref={formRef} onSubmit={handleSubmit} noValidate className='mx-auto mt-8 max-w-2xl space-y-6'>
          <Field label={t('nameLabel')} htmlFor='name' error={fieldErrors.name}>
            <input
              id='name'
              className={inputClassName}
              type='text'
              value={values.name}
              onChange={(event) => setField('name', event.target.value)}
              placeholder={t('namePlaceholder')}
            />
          </Field>

          <div data-field='iconKey'>
            <p className='m-0 mb-1.5 text-xs text-secondary-foreground'>{t('iconLabel')}</p>
            <Select
              aria-label={t('iconLabel')}
              value={values.iconKey ?? ''}
              onValueChange={(value) => setField('iconKey', isTopicIconKey(value) ? value : null)}
              options={iconOptions}
            />
          </div>

          {isEdit ? (
            <>
              <div>
                <p className='m-0 mb-1.5 text-xs text-secondary-foreground'>{t('slugLabel')}</p>
                <p className='m-0 text-sm text-muted-foreground'>{slug}</p>
              </div>

              <div>
                <p className='m-0 mb-1.5 text-xs text-secondary-foreground'>{t('usageLabel')}</p>
                <p className='m-0 text-sm text-foreground'>
                  {t('questionCount', { count: questionCount })} · {t('exerciseCount', { count: exerciseCount })}
                </p>
              </div>

              <div>
                <p className='m-0 mb-1.5 text-xs text-secondary-foreground'>{t('statusLabel')}</p>
                <div className='flex flex-col gap-2 sm:flex-row sm:gap-6'>
                  <label className='flex cursor-pointer items-center gap-2 text-sm text-foreground'>
                    <input
                      type='radio'
                      name='status'
                      className='size-3.5 cursor-pointer accent-primary'
                      checked={values.isActive}
                      onChange={() => setField('isActive', true)}
                    />
                    {t('active')}
                  </label>
                  <label className='flex cursor-pointer items-center gap-2 text-sm text-foreground'>
                    <input
                      type='radio'
                      name='status'
                      className='size-3.5 cursor-pointer accent-primary'
                      checked={!values.isActive}
                      onChange={() => setField('isActive', false)}
                    />
                    {t('disabled')}
                  </label>
                </div>
                <p className='m-0 mt-2 text-xs text-muted-foreground'>{t('statusHelp')}</p>
              </div>

              <section className='border-t border-border pt-6'>
                <h2 className='m-0 text-sm font-medium text-foreground'>{t('dangerZoneTitle')}</h2>
                <p className='mt-2 text-sm text-muted-foreground'>{canDelete ? t('deleteDescription') : t('deleteBlockedDescription')}</p>
                <button
                  type='button'
                  className={cn(destructiveButtonClassName, 'mt-4')}
                  disabled={!canDelete || isDeleting}
                  onClick={() => {
                    if (!canDelete || !window.confirm(t('deleteConfirm'))) return;
                    remove();
                  }}>
                  {isDeleting ? t('deleting') : t('deleteTopic')}
                </button>
              </section>
            </>
          ) : null}

          <div className='flex flex-col-reverse gap-2 border-t border-border pt-6 sm:flex-row sm:justify-end'>
            <Link href='/admin/topics' className={cn(secondaryButtonClassName, 'text-center')}>
              {t('cancel')}
            </Link>
            <button type='submit' className={primaryButtonClassName} disabled={isSubmitting}>
              {isSubmitting ? t('saving') : isEdit ? t('saveChanges') : t('createTopic')}
            </button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
