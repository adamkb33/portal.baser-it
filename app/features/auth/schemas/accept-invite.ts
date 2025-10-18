import { z } from 'zod';

export const acceptInviteSchema = z
  .object({
    inviteToken: z.string().nonempty(),
    givenName: z.string().trim().min(1, { message: 'First name is required' }),
    familyName: z.string().trim().min(1, { message: 'Last name is required' }),
    password: z.string().min(8, { message: 'Password must be at least 8 characters' }),
    confirmPassword: z.string().min(8, { message: 'Password confirmation must be at least 8 characters' }),
  })
  .superRefine((value, ctx) => {
    if (value.password !== value.confirmPassword) {
      ctx.addIssue({
        code: 'custom',
        path: ['confirmPassword'],
        message: 'Passwords must match',
      });
    }
  });

export type AcceptInviteSchema = z.infer<typeof acceptInviteSchema>;
