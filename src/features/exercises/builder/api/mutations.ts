import { apiDelete, apiPatch, apiPost } from '@/lib/api-client';
import type {
  CreateExerciseInput,
  CreateExerciseResponse,
  DeleteExerciseResponse,
  UpdateExerciseInput,
  UpdateExerciseResponse,
} from './contracts';

export async function createExercise(payload: CreateExerciseInput): Promise<CreateExerciseResponse> {
  return apiPost<CreateExerciseResponse>('/api/exercises', payload);
}

export async function updateExercise(id: string, payload: UpdateExerciseInput): Promise<UpdateExerciseResponse> {
  return apiPatch<UpdateExerciseResponse>(`/api/exercises/${id}`, payload);
}

export async function deleteExercise(id: string): Promise<DeleteExerciseResponse> {
  return apiDelete<DeleteExerciseResponse>(`/api/exercises/${id}`);
}
