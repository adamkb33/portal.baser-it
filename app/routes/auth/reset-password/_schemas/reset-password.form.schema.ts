import { z } from 'zod';
import { tokenValidator, passwordValidator } from '~/lib/form-validators';

export const resetPasswordFormSchema = z
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

export type ResetPasswordFormSchema = z.infer<typeof resetPasswordFormSchema>;
