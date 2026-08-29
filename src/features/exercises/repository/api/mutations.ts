import { apiDelete } from '@/lib/api-client';
import type { UnsaveExerciseResponse } from './contracts';

export async function unsaveExercise(exerciseId: string): Promise<UnsaveExerciseResponse> {
  return apiDelete<UnsaveExerciseResponse>(`/api/exercises/repository/${exerciseId}`);
}
