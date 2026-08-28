import { z } from 'zod';

export const SignInSchema = z.object({
  email: z.email({ error: 'invalidEmail' }),
  password: z.string().min(1, { error: 'passwordRequired' }),
});

export type SignInInput = z.infer<typeof SignInSchema>;

export const SignUpSchema = z.object({
  email: z.email({ error: 'invalidEmail' }),
  password: z.string().min(8, { error: 'passwordTooShort' }),
});

export type SignUpInput = z.infer<typeof SignUpSchema>;

export type SessionUser = { id: string; email: string | null };

export type SessionResponse = { user: SessionUser | null };
