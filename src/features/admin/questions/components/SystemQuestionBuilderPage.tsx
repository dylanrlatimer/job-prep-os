'use client';

import type { SubmitEvent, ReactNode } from 'react';
import { useMemo, useRef, useState } from 'react';
import Fuse from 'fuse.js';
import { ChevronLeft, Search, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import AppShell from '@/common/components/AppShell';
import ConfirmDialog from '@/common/components/ConfirmDialog';
import AdminGate from '@/features/admin/components/AdminGate';
import { useValidationMessage } from '@/common/hooks/use-validation-message';
import { inputClassName, primaryButtonClassName, secondaryButtonClassName, textareaClassName } from '@/common/styles/form';
import TiptapEditor from '@/common/components/TiptapEditor';
import { systemQuestionBuilderFieldOrder, useSystemQuestionBuilderForm } from '@/features/admin/questions/hooks/useSystemQuestionBuilderForm';
import type { BuilderCategory } from '@/features/theory/builder/api/contracts';
import QuestionBuilderSkeleton from '@/features/theory/builder/components/QuestionBuilderSkeleton';
import { scrollToFirstFormError } from '@/common/lib/scroll-to-first-form-error';
import { useFormGuard } from '@/common/form/use-form-guard';
import { cn } from '@/lib/cn';

type SystemQuestionBuilderPageProps = {
  questionId?: string;
};

type FieldProps = {
  label: string;
  htmlFor: string;
  error?: string;
  children: ReactNode;
};

function Field({ label, htmlFor, error, children }: FieldProps) {
  const errorMessage = useValidationMessage(error);

  return (
    <div data-field={htmlFor}>
      <label className='block' htmlFor={htmlFor}>
        <span className='mb-1.5 block text-xs text-secondary-foreground'>{label}</span>
        {children}
        {errorMessage ? <span className='mt-1.5 block text-xs text-destructive-bright'>{errorMessage}</span> : null}
      </label>
    </div>
  );
}

function useFilteredCategories(categories: BuilderCategory[], query: string) {
  const fuse = useMemo(
    () =>
      new Fuse(categories, {
        keys: ['name', 'slug'],
        threshold: 0.35,
        ignoreLocation: true,
      }),
    [categories],
  );

  return useMemo(() => {
    const trimmed = query.trim();
    if (!trimmed) return categories;
    return fuse.search(trimmed).map((result) => result.item);
  }, [categories, fuse, query]);
}

export default function SystemQuestionBuilderPage({ questionId }: SystemQuestionBuilderPageProps) {
  const t = useTranslations('AdminSystemQuestionBuilderPage');

  return (
    <AdminGate forbiddenMessage={t('forbidden')}>
      <SystemQuestionBuilderContent questionId={questionId} />
    </AdminGate>
  );
}

function SystemQuestionBuilderContent({ questionId }: SystemQuestionBuilderPageProps) {
  const t = useTranslations('AdminSystemQuestionBuilderPage');
  const formRef = useRef<HTMLFormElement>(null);
  const [categorySearch, setCategorySearch] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
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
    toggleCategory,
    onEditorReady,
    onDocumentUpdate,
    remove,
    refetch,
  } = useSystemQuestionBuilderForm({ questionId });

  useFormGuard(status, isDirty, isError);

  const answerErrorMessage = useValidationMessage(fieldErrors.answer);
  const categoriesErrorMessage = useValidationMessage(fieldErrors.categoryIds);
  const filteredCategories = useFilteredCategories(metadata?.categories ?? [], categorySearch);

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    const result = submit();

    if (!result.ok) {
      scrollToFirstFormError(result.fieldErrors, systemQuestionBuilderFieldOrder, formRef.current ?? document);
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

  const hasCategories = metadata.categories.length > 0;

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
              <h1 className='m-0 text-lg font-medium text-foreground'>{isEdit ? t('editTitle') : t('createTitle')}</h1>
              <p className='mt-1 max-w-2xl text-sm text-muted-foreground'>{isEdit ? t('editDescription') : t('createDescription')}</p>
            </div>

            {isEdit ? (
              <button
                type='button'
                className={cn(
                  'inline-flex shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-sm border border-destructive-border bg-destructive-subtle px-3 py-2 text-sm text-destructive-bright transition-colors hover:bg-destructive-subtle/80 disabled:cursor-not-allowed disabled:opacity-60',
                )}
                disabled={isDeleting}
                onClick={() => setDeleteDialogOpen(true)}>
                <Trash2 size={14} strokeWidth={1.75} aria-hidden='true' />
                {isDeleting ? t('deleting') : t('deleteQuestion')}
              </button>
            ) : null}
          </div>
        </header>

        <form ref={formRef} onSubmit={handleSubmit} noValidate className='mx-auto mt-8 max-w-2xl space-y-6'>
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

          <div data-field='categoryIds'>
            <span className='mb-1.5 block text-xs text-secondary-foreground'>{t('categoriesLabel')}</span>

            {!hasCategories ? (
              <p className='m-0 text-sm text-muted-foreground'>{t('noCategories')}</p>
            ) : (
              <div className='overflow-hidden rounded-sm border border-border bg-card'>
                <div className='border-b border-border px-3 py-2'>
                  <label className='relative block'>
                    <span className='sr-only'>{t('categoriesSearchLabel')}</span>
                    <Search
                      size={14}
                      strokeWidth={1.75}
                      className='pointer-events-none absolute top-1/2 left-0 -translate-y-1/2 text-muted-foreground'
                      aria-hidden='true'
                    />
                    <input
                      type='search'
                      className='w-full border-0 bg-transparent py-1 pr-1 pl-5 text-sm text-foreground placeholder:text-subtle-foreground focus:outline-none'
                      value={categorySearch}
                      onChange={(event) => setCategorySearch(event.target.value)}
                      placeholder={t('categoriesSearchPlaceholder')}
                    />
                  </label>
                </div>
                <div className='scrollbar-branded h-48 overflow-y-auto'>
                  {filteredCategories.length === 0 ? (
                    <p className='m-0 px-3 py-4 text-sm text-muted-foreground'>{t('categoriesNoResults')}</p>
                  ) : (
                    <ul className='m-0 list-none p-0'>
                      {filteredCategories.map((category, index) => {
                        const checked = values.categoryIds.includes(category.id);
                        const inputId = `category-${category.id}`;

                        return (
                          <li key={category.id} className={cn(index > 0 && 'border-t border-border')}>
                            <label htmlFor={inputId} className='flex cursor-pointer items-center gap-3 px-3 py-2.5 text-sm hover:bg-card-muted'>
                              <input
                                id={inputId}
                                type='checkbox'
                                className='size-3.5 shrink-0 cursor-pointer accent-primary'
                                checked={checked}
                                onChange={() => toggleCategory(category.id)}
                              />
                              <span className='text-foreground'>{category.name}</span>
                            </label>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </div>
            )}

            {categoriesErrorMessage ? <span className='mt-1.5 block text-xs text-destructive-bright'>{categoriesErrorMessage}</span> : null}
          </div>

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

          <div>
            <p className='m-0 mb-1.5 text-xs text-secondary-foreground'>{t('publicationLabel')}</p>
            <div className='flex flex-col gap-2 sm:flex-row sm:gap-6'>
              <label className='flex cursor-pointer items-center gap-2 text-sm text-foreground'>
                <input
                  type='radio'
                  name='publication'
                  className='size-3.5 cursor-pointer accent-primary'
                  checked={!values.isPublic}
                  onChange={() => setField('isPublic', false)}
                />
                {t('draft')}
              </label>
              <label className='flex cursor-pointer items-center gap-2 text-sm text-foreground'>
                <input
                  type='radio'
                  name='publication'
                  className='size-3.5 cursor-pointer accent-primary'
                  checked={values.isPublic}
                  onChange={() => setField('isPublic', true)}
                />
                {t('published')}
              </label>
            </div>
          </div>

          <div className='flex flex-col-reverse gap-2 border-t border-border pt-6 sm:flex-row sm:justify-end'>
            <Link href='/admin/questions' className={cn(secondaryButtonClassName, 'text-center')}>
              {t('cancel')}
            </Link>
            <button type='submit' className={primaryButtonClassName} disabled={isSubmitting || status !== 'ready'}>
              {isSubmitting ? t('saving') : isEdit ? t('saveChanges') : t('createQuestion')}
            </button>
          </div>
        </form>

        <ConfirmDialog
          open={deleteDialogOpen}
          title={t('deleteConfirmTitle')}
          description={t('deleteConfirmDescription')}
          cancelLabel={t('cancel')}
          confirmLabel={isDeleting ? t('deleting') : t('deleteQuestion')}
          confirmVariant='destructive'
          isConfirming={isDeleting}
          onCancel={() => setDeleteDialogOpen(false)}
          onConfirm={remove}
        />
      </div>
    </AppShell>
  );
}
