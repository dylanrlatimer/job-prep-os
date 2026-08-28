import { apiPatch } from '@/lib/api-client';
import type { SettingsResponse, UpdateDisplayNameInput } from './contracts';

export async function updateDisplayName(payload: UpdateDisplayNameInput): Promise<SettingsResponse> {
  return apiPatch<SettingsResponse>('/api/settings', payload);
}
