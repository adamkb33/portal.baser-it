import { z } from 'zod';

export const signInSchema = z.object({
  email: z.string().trim().min(1, { message: 'Email is required' }).email({ message: 'Enter a valid email address' }),
  password: z
    .string()
    .min(1, { message: 'Password is required' })
    .min(8, { message: 'Password must be at least 8 characters' }),
});

export type SignInSchema = z.infer<typeof signInSchema>;
