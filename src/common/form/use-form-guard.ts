'use client';

import type { FormStatus } from '@/common/form/use-snapshot-form';
import { useUnsavedChangesGuard } from '@/common/unsaved-changes/use-unsaved-changes-guard';

export function useFormGuard(status: FormStatus, isDirty: boolean, isError: boolean) {
  useUnsavedChangesGuard(status === 'ready' && isDirty && !isError);
}
