import { z } from 'zod';

export const UpdateDisplayNameSchema = z.object({
  displayName: z.string().trim().max(100, 'displayNameTooLong'),
});

export type UpdateDisplayNameInput = z.infer<typeof UpdateDisplayNameSchema>;

export type SettingsResponse = {
  email: string | null;
  displayName: string | null;
};
