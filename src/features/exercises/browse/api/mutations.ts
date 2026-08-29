import { apiPost } from '@/lib/api-client';
import type { SaveExerciseResponse } from './contracts';

export async function saveExercise(exerciseId: string): Promise<SaveExerciseResponse> {
  return apiPost<SaveExerciseResponse>(`/api/exercises/browse/${exerciseId}/save`, {});
}
