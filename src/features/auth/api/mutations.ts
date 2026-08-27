import { apiPost, apiRequest } from '@/lib/api-client';
import type { SignInInput, SignUpInput } from './contracts';

export async function signIn(body: SignInInput): Promise<void> {
  return apiPost<void>('/api/auth/sign-in', body);
}

export async function signUp(body: SignUpInput): Promise<void> {
  return apiPost<void>('/api/auth/sign-up', body);
}

export async function signOut(): Promise<void> {
  return apiRequest<void>('/api/auth/sign-out', { method: 'POST' });
}
