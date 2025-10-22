import { z } from 'zod';
import { emailValidator, passwordValidator } from '~/lib/form-validators';

export const signInSchema = z.object({
  email: emailValidator,
  password: passwordValidator,
});

export type SignInSchema = z.infer<typeof signInSchema>;
