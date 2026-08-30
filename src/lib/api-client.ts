import { ApiClientError } from '@/lib/errors/api-client-error';

export async function apiRequest<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...init, cache: 'no-store' });
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    const payload = body as { message?: string; code?: string } | null;
    throw new ApiClientError(payload?.code ?? 'REQUEST_FAILED', payload?.message ?? 'REQUEST_FAILED');
  }
  return body as T;
}

export function apiPost<T>(url: string, payload: unknown): Promise<T> {
  return apiRequest<T>(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export function apiPatch<T>(url: string, payload: unknown): Promise<T> {
  return apiRequest<T>(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export function apiDelete<T = void>(url: string): Promise<T> {
  return apiRequest<T>(url, { method: 'DELETE' });
}
