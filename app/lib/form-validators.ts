import { z } from 'zod';

export const emailValidator = z.email('Ugyldig e-postadresse');
export const passwordValidator = z.string().min(1, 'Passord er påkrevd').min(8, 'Passord må være minst 8 tegn');
export const inviteTokenValidator = z
  .string()
  .min(1, 'Invitasjonskode er påkrevd')
  .regex(/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/, 'Ugyldig invitasjonskode format');
