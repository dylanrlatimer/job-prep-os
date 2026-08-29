'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { useAllowUnsavedNavigation } from '@/common/unsaved-changes/use-unsaved-changes-guard';
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
  const allowNavigation = useAllowUnsavedNavigation();
  const queryClient = useQueryClient();
  const isEdit = !!categoryId;

  const [values, setValues] = useState<CategoryFormValues>(emptyValues);
  const [baseline, setBaseline] = useState<CategoryFormValues | null>(isEdit ? null : emptyValues);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof CategoryFormValues, string>>>({});
  const [slug, setSlug] = useState('');
  const [questionCount, setQuestionCount] = useState(0);

  const categoryQuery = useQuery({
    ...categoryQueryOptions(categoryId ?? ''),
    enabled: isEdit,
  });

  useEffect(() => {
    if (!categoryQuery.data) return;

    const loaded = {
      name: categoryQuery.data.name,
      isActive: categoryQuery.data.isActive,
    };

    setValues(loaded);
    setBaseline(loaded);
    setSlug(categoryQuery.data.slug);
    setQuestionCount(categoryQuery.data.questionCount);
  }, [categoryQuery.data]);

  const isDirty = baseline !== null && !areCategoryFormValuesEqual(values, baseline);

  const onSaveSuccess = useCallback(
    async (id: string) => {
      await invalidateAdminCategoryCaches(queryClient, id);
      useToastStore.getState().addToast(isEdit ? t('updateSuccess') : t('createSuccess'), 'success');
      allowNavigation(() => router.push('/admin/categories'));
    },
    [allowNavigation, isEdit, queryClient, router, t],
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
    onSuccess: async () => {
      await invalidateAdminCategoryCaches(queryClient, categoryId);
      useToastStore.getState().addToast(t('deleteSuccess'), 'success');
      allowNavigation(() => router.push('/admin/categories'));
    },
  });

  const isSubmitting = isCreating || isUpdating;

  const submit = useCallback((): CategoryBuilderSubmitResult => {
    const parsed = isEdit ? UpdateCategorySchema.safeParse(toUpdateInput(values)) : CategoryInputSchema.safeParse(toCreateInput(values));

    if (!parsed.success) {
      const errors = mapZodFieldErrors(parsed.error);
      setFieldErrors(errors);
      return { ok: false, fieldErrors: errors };
    }

    setFieldErrors({});

    if (isEdit) {
      mutateUpdate(parsed.data as UpdateCategoryInput);
      return { ok: true };
    }

    mutateCreate(parsed.data as CategoryInput);
    return { ok: true };
  }, [isEdit, mutateCreate, mutateUpdate, values]);

  const setField = useCallback(<K extends keyof CategoryFormValues>(field: K, value: CategoryFormValues[K]) => {
    setValues((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  }, []);

  const remove = useCallback(() => {
    if (!isEdit || isDeleting) return;
    mutateDelete();
  }, [isDeleting, isEdit, mutateDelete]);

  const isLoading = isEdit && categoryQuery.isPending;
  const isError = isEdit && categoryQuery.isError;

  return useMemo(
    () => ({
      isEdit,
      values,
      fieldErrors,
      isDirty,
      slug,
      questionCount,
      isLoading,
      isError,
      isSubmitting,
      isDeleting,
      submit,
      setField,
      remove,
      refetch: () => {
        if (isEdit) void categoryQuery.refetch();
      },
    }),
    [categoryQuery, fieldErrors, isDeleting, isDirty, isEdit, isError, isLoading, isSubmitting, questionCount, remove, setField, slug, submit, values],
  );
}
