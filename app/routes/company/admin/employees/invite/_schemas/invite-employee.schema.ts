import { z } from 'zod';
import { emailValidator, rolesValidator } from '~/lib/form-validators';

export const inviteEmployeeSchema = z.object({
  email: emailValidator,
  roles: rolesValidator,
});

export type InviteEmployeeSchema = z.infer<typeof inviteEmployeeSchema>;
