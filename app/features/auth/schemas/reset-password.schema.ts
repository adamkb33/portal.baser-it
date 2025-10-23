import { z } from 'zod';
import { tokenValidator, passwordValidator } from '~/lib/form-validators';

export const resetPasswordSchema = z
  .object({
    resetPasswordToken: tokenValidator,
    password: passwordValidator,
    confirmPassword: passwordValidator,
  })
  .superRefine((value, ctx) => {
    if (value.password !== value.confirmPassword) {
      ctx.addIssue({
        code: 'custom',
        path: ['confirmPassword'],
        message: 'Passordene må være like',
      });
    }
  });

export type ResetPasswordSchema = z.infer<typeof resetPasswordSchema>;
