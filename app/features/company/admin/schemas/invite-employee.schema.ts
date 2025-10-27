import { z } from 'zod';
import { emailValidator, rolesValidator } from '~/lib/form-validators';

export const inviteEmployeeSchema = z.object({
  givenName: z.string().min(1, 'Given name is required'),
  familyName: z.string().min(1, 'Family name is required'),
  email: emailValidator,
  roles: rolesValidator,
});

export type InviteEmployeeSchema = z.infer<typeof inviteEmployeeSchema>;
