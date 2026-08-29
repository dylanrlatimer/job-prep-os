import { apiPost } from '@/lib/api-client';
import type { SubmitExerciseAnswerInput, SubmitExerciseAnswerResponse } from './contracts';

export async function submitExerciseAnswer(
  exerciseId: string,
  payload: SubmitExerciseAnswerInput,
): Promise<SubmitExerciseAnswerResponse> {
  return apiPost<SubmitExerciseAnswerResponse>(`/api/exercises/${exerciseId}/practice/submit`, payload);
}
