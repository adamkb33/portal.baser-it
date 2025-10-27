import { z } from 'zod';
import { Roles } from '~/api/clients/types';

export const emailValidator = z.email('Ugyldig e-postadresse');
export const passwordValidator = z.string().min(1, 'Passord er påkrevd').min(8, 'Passord må være minst 8 tegn');
export const tokenValidator = z
  .string()
  .min(1, 'Invitasjonskode er påkrevd')
  .regex(/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/, 'Ugyldig kode format');

export const rolesValidator = z
  .array(z.enum(Object.values(Roles) as [string, ...string[]]))
  .min(1, 'Minst én rolle er påkrevd');
