'use client';

import { useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { primaryButtonClassName, secondaryButtonClassName } from '@/common/styles/form';
import { cn } from '@/lib/cn';

type UnsavedChangesDialogProps = {
  open: boolean;
  onStay: () => void;
  onLeave: () => void;
};

export default function UnsavedChangesDialog({ open, onStay, onLeave }: UnsavedChangesDialogProps) {
  const t = useTranslations('UnsavedChangesDialog');
  const stayButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    stayButtonRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onStay();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onStay, open]);

  if (!open) return null;

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center p-4' role='presentation'>
      <button
        type='button'
        className='absolute inset-0 bg-canvas/80'
        aria-label={t('stay')}
        onClick={onStay}
      />
      <div
        role='dialog'
        aria-modal='true'
        aria-labelledby='unsaved-changes-title'
        aria-describedby='unsaved-changes-description'
        className='relative w-full max-w-sm rounded-sm border border-border bg-card p-5 shadow-none'>
        <h2 id='unsaved-changes-title' className='m-0 text-sm font-medium text-foreground'>
          {t('title')}
        </h2>
        <p id='unsaved-changes-description' className='mt-2 text-sm text-muted-foreground'>
          {t('description')}
        </p>
        <div className='mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end'>
          <button ref={stayButtonRef} type='button' className={cn(primaryButtonClassName, 'w-full sm:w-auto')} onClick={onStay}>
            {t('stay')}
          </button>
          <button type='button' className={cn(secondaryButtonClassName, 'w-full sm:w-auto')} onClick={onLeave}>
            {t('leave')}
          </button>
        </div>
      </div>
    </div>
  );
}
