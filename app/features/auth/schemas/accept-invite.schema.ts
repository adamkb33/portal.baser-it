import { z } from 'zod';
import { inviteTokenValidator, passwordValidator } from '~/lib/form-validators';

export const acceptInviteSchema = z
  .object({
    inviteToken: inviteTokenValidator,
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
