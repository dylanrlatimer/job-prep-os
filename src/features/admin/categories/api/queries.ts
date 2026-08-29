import { queryOptions } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api-client';
import { adminKeys } from '@/features/admin/api/query-keys';
import type { CategoryResponse, ListAdminCategoriesResponse } from './contracts';

export const adminCategoriesQueryOptions = queryOptions({
  queryKey: adminKeys.categories(),
  queryFn: () => apiRequest<ListAdminCategoriesResponse>('/api/admin/categories'),
});

export const categoryQueryOptions = (id: string) =>
  queryOptions({
    queryKey: adminKeys.category(id),
    queryFn: () => apiRequest<CategoryResponse>(`/api/admin/categories/${id}`),
    enabled: !!id,
  });
