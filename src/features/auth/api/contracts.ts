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

export const ForgotPasswordSchema = z.object({
  email: z.email({ error: 'invalidEmail' }),
});

export type ForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>;

export const UpdatePasswordSchema = z.object({
  password: z.string().min(8, { error: 'passwordTooShort' }),
});

export type UpdatePasswordInput = z.infer<typeof UpdatePasswordSchema>;

export type SessionUser = { id: string; email: string | null; isAdmin: boolean };

export type SessionResponse = { user: SessionUser | null };
