import { apiDelete, apiPatch, apiPost } from '@/lib/api-client';
import type { CategoryInput, CreateCategoryResponse, DeleteCategoryResponse, UpdateCategoryInput, UpdateCategoryResponse } from './contracts';

export async function createCategory(payload: CategoryInput): Promise<CreateCategoryResponse> {
  return apiPost<CreateCategoryResponse>('/api/admin/categories', payload);
}

export async function updateCategory(id: string, payload: UpdateCategoryInput): Promise<UpdateCategoryResponse> {
  return apiPatch<UpdateCategoryResponse>(`/api/admin/categories/${id}`, payload);
}

export async function deleteCategory(id: string): Promise<DeleteCategoryResponse> {
  return apiDelete<DeleteCategoryResponse>(`/api/admin/categories/${id}`);
}
