import { apiDelete, apiPatch, apiPost } from '@/lib/api-client';
import type {
  CreateSystemExerciseInput,
  CreateSystemExerciseResponse,
  DeleteSystemExerciseResponse,
  UpdateSystemExerciseInput,
  UpdateSystemExerciseResponse,
} from './contracts';

export async function createSystemExercise(payload: CreateSystemExerciseInput): Promise<CreateSystemExerciseResponse> {
  return apiPost<CreateSystemExerciseResponse>('/api/admin/exercises', payload);
}

export async function updateSystemExercise(id: string, payload: UpdateSystemExerciseInput): Promise<UpdateSystemExerciseResponse> {
  return apiPatch<UpdateSystemExerciseResponse>(`/api/admin/exercises/${id}`, payload);
}

export async function deleteSystemExercise(id: string): Promise<DeleteSystemExerciseResponse> {
  return apiDelete<DeleteSystemExerciseResponse>(`/api/admin/exercises/${id}`);
}
