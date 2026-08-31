'use client';

import type { ReactNode } from 'react';
import { useValidationMessage } from '@/common/hooks/use-validation-message';

type FieldProps = {
  label: string;
  htmlFor: string;
  error?: string;
  children: ReactNode;
};

export default function Field({ label, htmlFor, error, children }: FieldProps) {
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
