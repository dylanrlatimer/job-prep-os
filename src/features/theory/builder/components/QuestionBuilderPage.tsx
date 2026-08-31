'use client';

import type { SubmitEvent } from 'react';
import { useRef, useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import AppShell from '@/common/components/AppShell';
import Field from '@/common/components/Field';
import TopicsPickerField from '@/common/components/TopicsPickerField';
import TypeToConfirmDialog from '@/common/components/TypeToConfirmDialog';
import VisibilityField from '@/common/components/VisibilityField';
import { useValidationMessage } from '@/common/hooks/use-validation-message';
import { destructiveButtonClassName, inputClassName, primaryButtonClassName, secondaryButtonClassName, textareaClassName } from '@/common/styles/form';
import TiptapEditor from '@/common/components/TiptapEditor';
import { useQuestionBuilderForm, questionBuilderFieldOrder } from '@/features/theory/builder/hooks/useQuestionBuilderForm';
import type { BuilderToastMessages, BuilderVariant } from '@/features/theory/builder/hooks/useQuestionBuilderForm';
import QuestionBuilderSkeleton from './QuestionBuilderSkeleton';
import { scrollToFirstFormError } from '@/common/lib/scroll-to-first-form-error';
import { useFormGuard } from '@/common/form/use-form-guard';
import { cn } from '@/lib/cn';

type QuestionBuilderPageProps = {
  questionId?: string;
  variant?: BuilderVariant;
  backLink?: { href: string; label: string };
  cancelHref?: string;
  visibilityLabels?: { label: string; falseLabel: string; trueLabel: string };
  toastMessages?: BuilderToastMessages;
};

export default function QuestionBuilderPage({ questionId, variant = 'user', backLink, cancelHref, visibilityLabels, toastMessages }: QuestionBuilderPageProps) {
  const t = useTranslations('QuestionBuilderPage');
  const formRef = useRef<HTMLFormElement>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const resolvedBackLink = backLink ?? { href: '/', label: t('backToRepository') };
  const resolvedCancelHref = cancelHref ?? '/';
  const resolvedVisibilityLabels = visibilityLabels ?? {
    label: t('visibilityLabel'),
    falseLabel: t('visibilityPrivate'),
    trueLabel: t('visibilityPublic'),
  };
  const resolvedToastMessages = toastMessages ?? {
    createSuccess: t('createSuccess'),
    updateSuccess: t('updateSuccess'),
    deleteSuccess: t('deleteSuccess'),
  };

  const {
    isEdit,
    values,
    fieldErrors,
    isDirty,
    status,
    initialDocument,
    editorRef,
    metadata,
    isLoading,
    isError,
    isFormDataReady,
    isSubmitting,
    isDeleting,
    submit,
    setField,
    toggleTopic,
    onEditorReady,
    onDocumentUpdate,
    remove,
    refetch,
  } = useQuestionBuilderForm({
    questionId,
    variant,
    toastMessages: resolvedToastMessages,
  });

  useFormGuard(status, isDirty, isError);

  const answerErrorMessage = useValidationMessage(fieldErrors.answer);

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    const result = submit();

    if (!result.ok) {
      scrollToFirstFormError(result.fieldErrors, questionBuilderFieldOrder, formRef.current ?? document);
    }
  };

  if (isLoading || !isFormDataReady) {
    return (
      <AppShell>
        <QuestionBuilderSkeleton />
      </AppShell>
    );
  }

  if (isError || !metadata) {
    return (
      <AppShell>
        <div className='px-4 py-8 md:px-8'>
          <h1 className='m-0 text-lg font-medium text-foreground'>{isEdit ? t('editTitle') : t('createTitle')}</h1>
          <p className='mt-2 text-sm text-muted-foreground'>{t('loadError')}</p>
          <button type='button' className={cn(secondaryButtonClassName, 'mt-4')} onClick={refetch}>
            {t('retry')}
          </button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className='px-4 py-8 md:px-8'>
        <Link
          href={resolvedBackLink.href}
          className='inline-flex items-center gap-1 text-sm text-muted-foreground no-underline transition-colors hover:text-foreground'>
          <ChevronLeft size={16} strokeWidth={1.75} aria-hidden='true' />
          {resolvedBackLink.label}
        </Link>

        <header className='mt-4 border-b border-border pb-6'>
          <div className='flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between'>
            <div className='min-w-0 flex-1'>
              <h1 className='m-0 text-lg font-medium text-foreground'>{isEdit ? t('editTitle') : t('createTitle')}</h1>
              <p className='mt-1 max-w-2xl text-sm text-muted-foreground'>{isEdit ? t('editDescription') : t('createDescription')}</p>
            </div>

            {isEdit ? (
              <button
                type='submit'
                form='question-builder-form'
                className={cn(primaryButtonClassName, 'shrink-0')}
                disabled={isSubmitting || status !== 'ready'}>
                {isSubmitting ? t('saving') : t('saveChanges')}
              </button>
            ) : null}
          </div>
        </header>

        <form id='question-builder-form' ref={formRef} onSubmit={handleSubmit} noValidate className='mx-auto mt-8 max-w-2xl space-y-6'>
          <Field label={t('questionLabel')} htmlFor='question' error={fieldErrors.question}>
            <textarea
              id='question'
              className={textareaClassName}
              value={values.question}
              onChange={(event) => setField('question', event.target.value)}
              placeholder={t('questionPlaceholder')}
              rows={4}
            />
          </Field>

          <div data-field='answer'>
            <span className='mb-1.5 block text-xs text-secondary-foreground'>{t('answerLabel')}</span>
            <TiptapEditor
              key={questionId ?? 'new'}
              ref={editorRef}
              id='answer'
              initialContent={initialDocument}
              onEditorReady={onEditorReady}
              onUpdate={onDocumentUpdate}
              disabled={status !== 'ready'}
            />
            {answerErrorMessage ? <span className='mt-1.5 block text-xs text-destructive-bright'>{answerErrorMessage}</span> : null}
          </div>

          <TopicsPickerField
            topics={metadata.topics}
            selectedIds={values.topicIds}
            onToggle={toggleTopic}
            error={fieldErrors.topicIds}
            labels={{
              fieldLabel: t('topicsLabel'),
              searchLabel: t('topicsSearchLabel'),
              searchPlaceholder: t('topicsSearchPlaceholder'),
              noTopicsMessage: t('noTopics'),
              noResultsMessage: t('topicsNoResults'),
            }}
          />

          <Field label={t('sourceNameLabel')} htmlFor='sourceName' error={fieldErrors.sourceName}>
            <input
              id='sourceName'
              className={inputClassName}
              type='text'
              value={values.sourceName}
              onChange={(event) => setField('sourceName', event.target.value)}
              placeholder={t('sourceNamePlaceholder')}
              maxLength={200}
            />
          </Field>

          <Field label={t('sourceUrlLabel')} htmlFor='sourceUrl' error={fieldErrors.sourceUrl}>
            <input
              id='sourceUrl'
              className={inputClassName}
              type='url'
              value={values.sourceUrl}
              onChange={(event) => setField('sourceUrl', event.target.value)}
              placeholder={t('sourceUrlPlaceholder')}
              inputMode='url'
            />
          </Field>

          <VisibilityField
            value={values.isPublic}
            onChange={(value) => setField('isPublic', value)}
            label={resolvedVisibilityLabels.label}
            falseLabel={resolvedVisibilityLabels.falseLabel}
            trueLabel={resolvedVisibilityLabels.trueLabel}
            radioName='visibility'
          />

          {isEdit ? (
            <section className='border-t border-border pt-6'>
              <h2 className='m-0 text-sm font-medium text-foreground'>{t('dangerZoneTitle')}</h2>
              <p className='mt-2 text-sm text-muted-foreground'>{t('deleteDescription')}</p>
              <button type='button' className={cn(destructiveButtonClassName, 'mt-4')} disabled={isDeleting} onClick={() => setDeleteDialogOpen(true)}>
                {isDeleting ? t('deleting') : t('deleteQuestion')}
              </button>
            </section>
          ) : null}

          <div className='flex flex-col-reverse gap-2 border-t border-border pt-6 sm:flex-row sm:justify-end'>
            <Link href={resolvedCancelHref} className={cn(secondaryButtonClassName, 'text-center')}>
              {t('cancel')}
            </Link>
            <button type='submit' className={primaryButtonClassName} disabled={isSubmitting || status !== 'ready'}>
              {isSubmitting ? t('saving') : isEdit ? t('saveChanges') : t('createQuestion')}
            </button>
          </div>
        </form>

        <TypeToConfirmDialog
          open={deleteDialogOpen}
          title={t('deleteConfirmTitle')}
          description={t('deleteConfirmDescription')}
          inputLabel={t('deleteConfirmTypeLabel', { word: t('deleteConfirmWord') })}
          confirmWord={t('deleteConfirmWord')}
          cancelLabel={t('cancel')}
          confirmLabel={isDeleting ? t('deleting') : t('deleteQuestion')}
          isConfirming={isDeleting}
          onCancel={() => setDeleteDialogOpen(false)}
          onConfirm={remove}
        />
      </div>
    </AppShell>
  );
}
