'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { useReleaseUnsavedGuard } from '@/common/unsaved-changes/use-unsaved-changes-guard';
import { useSnapshotForm } from '@/common/form/use-snapshot-form';
import { invalidateAdminCategoryCaches } from '@/features/admin/api/invalidate-admin-caches';
import { CategoryInputSchema, UpdateCategorySchema, type CategoryInput, type UpdateCategoryInput } from '@/features/admin/categories/api/contracts';
import { createCategory, deleteCategory, updateCategory } from '@/features/admin/categories/api/mutations';
import { categoryQueryOptions } from '@/features/admin/categories/api/queries';
import { useToastStore } from '@/lib/store/use-toast-store';

export type CategoryFormValues = {
  name: string;
  isActive: boolean;
};

const emptyValues: CategoryFormValues = {
  name: '',
  isActive: true,
};

function toCreateInput(values: CategoryFormValues): CategoryInput {
  return { name: values.name };
}

function toUpdateInput(values: CategoryFormValues): UpdateCategoryInput {
  return { name: values.name, isActive: values.isActive };
}

function areCategoryFormValuesEqual(left: CategoryFormValues, right: CategoryFormValues) {
  return left.name === right.name && left.isActive === right.isActive;
}

function mapZodFieldErrors(error: { issues: Array<{ path: PropertyKey[]; message: string }> }) {
  const fieldErrors: Partial<Record<keyof CategoryFormValues, string>> = {};

  for (const issue of error.issues) {
    const field = issue.path[0];
    if (typeof field === 'string' && !(field in fieldErrors)) {
      fieldErrors[field as keyof CategoryFormValues] = issue.message;
    }
  }

  return fieldErrors;
}

type UseCategoryBuilderFormOptions = {
  categoryId?: string;
};

export type CategoryBuilderSubmitResult = { ok: true } | { ok: false; fieldErrors: Partial<Record<keyof CategoryFormValues, string>> };

export const categoryBuilderFieldOrder = ['name'] as const;

export function useCategoryBuilderForm({ categoryId }: UseCategoryBuilderFormOptions) {
  const t = useTranslations('AdminCategoryBuilderPage');
  const router = useRouter();
  const releaseGuard = useReleaseUnsavedGuard();
  const queryClient = useQueryClient();
  const isEdit = !!categoryId;

  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof CategoryFormValues, string>>>({});
  const [slug, setSlug] = useState('');
  const [questionCount, setQuestionCount] = useState(0);

  const categoryQuery = useQuery({
    ...categoryQueryOptions(categoryId ?? ''),
    enabled: isEdit,
  });

  const loadedScalars = useMemo((): CategoryFormValues | null => {
    if (!categoryQuery.data) return null;

    return {
      name: categoryQuery.data.name,
      isActive: categoryQuery.data.isActive,
    };
  }, [categoryQuery.data]);

  const isDataLoading = isEdit && categoryQuery.isPending;
  const isDataError = isEdit && categoryQuery.isError;

  const form = useSnapshotForm<CategoryFormValues, CategoryFormValues>({
    isEdit,
    emptyScalars: emptyValues,
    loadedScalars,
    isDataLoading,
    isDataError,
    hasDocumentField: false,
    toSnapshot: (scalars) => scalars,
    snapshotsEqual: areCategoryFormValuesEqual,
  });

  useEffect(() => {
    if (!categoryQuery.data) return;
    setSlug(categoryQuery.data.slug);
    setQuestionCount(categoryQuery.data.questionCount);
  }, [categoryQuery.data]);

  const onSaveSuccess = useCallback(
    (id: string) => {
      form.commitSnapshot();
      releaseGuard();
      useToastStore.getState().addToast(isEdit ? t('updateSuccess') : t('createSuccess'), 'success');
      router.push('/admin/categories');
      void invalidateAdminCategoryCaches(queryClient, id);
    },
    [form, isEdit, queryClient, releaseGuard, router, t],
  );

  const { mutate: mutateCreate, isPending: isCreating } = useMutation({
    mutationFn: createCategory,
    onSuccess: (response) => onSaveSuccess(response.id),
  });

  const { mutate: mutateUpdate, isPending: isUpdating } = useMutation({
    mutationFn: (payload: UpdateCategoryInput) => updateCategory(categoryId!, payload),
    onSuccess: (response) => onSaveSuccess(response.id),
  });

  const { mutate: mutateDelete, isPending: isDeleting } = useMutation({
    mutationFn: () => deleteCategory(categoryId!),
    onSuccess: () => {
      releaseGuard();
      useToastStore.getState().addToast(t('deleteSuccess'), 'success');
      router.push('/admin/categories');
      void invalidateAdminCategoryCaches(queryClient, categoryId);
    },
  });

  const isSubmitting = isCreating || isUpdating;

  const submit = useCallback((): CategoryBuilderSubmitResult => {
    const snapshot = form.getSnapshot();
    const parsed = isEdit ? UpdateCategorySchema.safeParse(toUpdateInput(snapshot)) : CategoryInputSchema.safeParse(toCreateInput(snapshot));

    if (!parsed.success) {
      const errors = mapZodFieldErrors(parsed.error);
      setFieldErrors(errors);
      return { ok: false, fieldErrors: errors };
    }

    setFieldErrors({});
    form.markSubmitting();

    if (isEdit) {
      mutateUpdate(parsed.data as UpdateCategoryInput);
      return { ok: true };
    }

    mutateCreate(parsed.data as CategoryInput);
    return { ok: true };
  }, [form, isEdit, mutateCreate, mutateUpdate]);

  const setField = useCallback(
    <K extends keyof CategoryFormValues>(field: K, value: CategoryFormValues[K]) => {
      form.setScalar(field, value);
      setFieldErrors((current) => {
        if (!current[field]) return current;
        const next = { ...current };
        delete next[field];
        return next;
      });
    },
    [form],
  );

  const remove = useCallback(() => {
    if (!isEdit || isDeleting) return;
    mutateDelete();
  }, [isDeleting, isEdit, mutateDelete]);

  return useMemo(
    () => ({
      isEdit,
      values: form.scalars,
      fieldErrors,
      isDirty: form.isDirty,
      status: form.status,
      slug,
      questionCount,
      isLoading: isDataLoading,
      isError: isDataError,
      isSubmitting,
      isDeleting,
      submit,
      setField,
      remove,
      refetch: () => {
        if (isEdit) void categoryQuery.refetch();
      },
    }),
    [
      categoryQuery,
      fieldErrors,
      form,
      isDataError,
      isDataLoading,
      isDeleting,
      isEdit,
      isSubmitting,
      questionCount,
      remove,
      setField,
      slug,
      submit,
    ],
  );
}
