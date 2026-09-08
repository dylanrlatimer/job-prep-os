import { apiPatch } from '@/lib/api-client';
import type { SettingsResponse, UpdateSettingsInput } from './contracts';

export async function updateSettings(payload: UpdateSettingsInput): Promise<SettingsResponse> {
  return apiPatch<SettingsResponse>('/api/settings', payload);
}
