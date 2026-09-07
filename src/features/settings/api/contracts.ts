import { z } from 'zod';

export const UpdateSettingsSchema = z.object({
  displayName: z.string().trim().max(100, { error: 'displayNameTooLong' }),
  exerciseRatio: z.number().int().min(0).max(100),
});

export type UpdateSettingsInput = z.infer<typeof UpdateSettingsSchema>;

export type SettingsResponse = {
  email: string | null;
  displayName: string | null;
  exerciseRatio: number;
};
