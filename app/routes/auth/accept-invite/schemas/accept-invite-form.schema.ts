import { z } from 'zod';
import { passwordValidator } from '~/lib/form-validators';

export const acceptInviteSchema = z
  .object({
    inviteToken: z.string().min(1, { message: 'Kode er påkrevd' }),
    givenName: z.string().trim().min(1, { message: 'Fornavn er påkrevd' }),
    familyName: z.string().trim().min(1, { message: 'Etternavn er påkrevd' }),
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

export type AcceptInviteSchema = z.infer<typeof acceptInviteSchema>;
