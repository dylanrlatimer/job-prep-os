'use client';

import type { SubmitEvent, ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import AppShell from '@/common/components/AppShell';
import { useValidationMessage } from '@/common/hooks/use-validation-message';
import { inputClassName, primaryButtonClassName, secondaryButtonClassName, textareaClassName } from '@/common/styles/form';
import { useQuestionBuilderForm } from '@/features/theory/builder/hooks/useQuestionBuilderForm';
import QuestionBuilderSkeleton from './QuestionBuilderSkeleton';
import { cn } from '@/lib/cn';

type QuestionBuilderPageProps = {
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
    <label className='block' htmlFor={htmlFor}>
      <span className='mb-1.5 block text-xs text-secondary-foreground'>{label}</span>
      {children}
      {errorMessage ? <span className='mt-1.5 block text-xs text-destructive-bright'>{errorMessage}</span> : null}
    </label>
  );
}

export default function QuestionBuilderPage({ questionId }: QuestionBuilderPageProps) {
  const t = useTranslations('QuestionBuilderPage');
  const { isEdit, values, fieldErrors, metadata, isLoading, isError, isSubmitting, submit, setField, toggleCategory, refetch } = useQuestionBuilderForm({
    questionId,
  });

  const categoriesErrorMessage = useValidationMessage(fieldErrors.categoryIds);

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    submit();
  };

  if (isLoading) {
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
        <Link href='/' className='text-sm text-muted-foreground no-underline hover:text-foreground hover:underline'>
          {t('backToRepository')}
        </Link>

        <header className='mt-4 border-b border-border pb-6'>
          <h1 className='m-0 text-lg font-medium text-foreground'>{isEdit ? t('editTitle') : t('createTitle')}</h1>
          <p className='mt-1 max-w-2xl text-sm text-muted-foreground'>{isEdit ? t('editDescription') : t('createDescription')}</p>
        </header>

        <form onSubmit={handleSubmit} className='mx-auto mt-8 max-w-2xl space-y-6'>
          <Field label={t('questionLabel')} htmlFor='question' error={fieldErrors.question}>
            <textarea
              id='question'
              className={textareaClassName}
              value={values.question}
              onChange={(event) => setField('question', event.target.value)}
              placeholder={t('questionPlaceholder')}
              rows={4}
              required
            />
          </Field>

          <Field label={t('answerLabel')} htmlFor='answer' error={fieldErrors.answer}>
            <textarea
              id='answer'
              className={textareaClassName}
              value={values.answer}
              onChange={(event) => setField('answer', event.target.value)}
              placeholder={t('answerPlaceholder')}
              rows={6}
              required
            />
          </Field>

          <div>
            <span className='mb-1.5 block text-xs text-secondary-foreground'>{t('categoriesLabel')}</span>

            {!hasCategories ? (
              <p className='m-0 text-sm text-muted-foreground'>{t('noCategories')}</p>
            ) : (
              <div className='rounded-sm border border-border'>
                <ul className='m-0 max-h-48 list-none overflow-y-auto p-0'>
                  {metadata.categories.map((category, index) => {
                    const checked = values.categoryIds.includes(category.id);
                    const inputId = `category-${category.id}`;

                    return (
                      <li key={category.id} className={cn(index > 0 && 'border-t border-border')}>
                        <label htmlFor={inputId} className='flex cursor-pointer items-center gap-3 px-3 py-2.5 text-sm hover:bg-card-muted'>
                          <input
                            id={inputId}
                            type='checkbox'
                            className='size-3.5 shrink-0 accent-primary'
                            checked={checked}
                            onChange={() => toggleCategory(category.id)}
                          />
                          <span className='text-foreground'>{category.name}</span>
                        </label>
                      </li>
                    );
                  })}
                </ul>
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

          <fieldset className='m-0 border-0 p-0'>
            <legend className='mb-1.5 block text-xs text-secondary-foreground'>{t('visibilityLabel')}</legend>
            <div className='flex flex-col gap-2 sm:flex-row sm:gap-6'>
              <label className='flex cursor-pointer items-center gap-2 text-sm text-foreground'>
                <input
                  type='radio'
                  name='visibility'
                  className='size-3.5 accent-primary'
                  checked={!values.isPublic}
                  onChange={() => setField('isPublic', false)}
                />
                {t('visibilityPrivate')}
              </label>
              <label className='flex cursor-pointer items-center gap-2 text-sm text-foreground'>
                <input
                  type='radio'
                  name='visibility'
                  className='size-3.5 accent-primary'
                  checked={values.isPublic}
                  onChange={() => setField('isPublic', true)}
                />
                {t('visibilityPublic')}
              </label>
            </div>
          </fieldset>

          <div className='flex flex-col-reverse gap-2 border-t border-border pt-6 sm:flex-row sm:justify-end'>
            <Link href='/' className={cn(secondaryButtonClassName, 'text-center')}>
              {t('cancel')}
            </Link>
            <button type='submit' className={primaryButtonClassName} disabled={isSubmitting || !hasCategories}>
              {isSubmitting ? t('saving') : isEdit ? t('saveChanges') : t('createQuestion')}
            </button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
