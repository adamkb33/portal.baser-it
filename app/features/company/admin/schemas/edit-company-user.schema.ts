import { z } from 'zod';
import { rolesValidator } from '~/lib/form-validators';

export const editCompanyUserSchema = z.object({
  roles: rolesValidator,
});

export type EditCompanyUserSchema = z.infer<typeof editCompanyUserSchema>;
