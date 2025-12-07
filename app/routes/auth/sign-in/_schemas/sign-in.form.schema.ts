import { z } from 'zod';
import { emailValidator, passwordValidator } from '~/lib/form-validators';

export const signInFormSchema = z.object({
  email: emailValidator,
  password: passwordValidator,
});

export type SignInFormSchema = z.infer<typeof signInFormSchema>;
