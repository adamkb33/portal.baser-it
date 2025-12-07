import { z } from 'zod';
import { emailValidator } from '~/lib/form-validators';

export const forgotPasswordSchema = z.object({
  email: emailValidator,
});

export type ForgotPasswordSchema = z.infer<typeof forgotPasswordSchema>;
