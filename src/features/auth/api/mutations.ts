import { apiPost, apiRequest } from '@/lib/api-client';
import type { ForgotPasswordInput, SignInInput, SignUpInput, UpdatePasswordInput } from './contracts';

export async function signIn(body: SignInInput): Promise<void> {
  return apiPost<void>('/api/auth/sign-in', body);
}

export async function signUp(body: SignUpInput): Promise<void> {
  return apiPost<void>('/api/auth/sign-up', body);
}

export async function signOut(): Promise<void> {
  return apiRequest<void>('/api/auth/sign-out', { method: 'POST' });
}

export async function forgotPassword(body: ForgotPasswordInput): Promise<void> {
  return apiPost<void>('/api/auth/forgot-password', body);
}

export async function updatePassword(body: UpdatePasswordInput): Promise<void> {
  return apiPost<void>('/api/auth/update-password', body);
}
