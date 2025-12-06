import { z } from 'zod';
import { emailValidator } from '~/lib/form-validators';

const mobileNumberValidator = z.string().length(8, 'Mobilnummer må være 8 siffer');

export const getOrCreateContactSchema = z
  .object({
    id: z.number().optional(),
    companyId: z.number(),
    givenName: z.string().min(1, 'Fornavn er påkrevd'),
    familyName: z.string().min(1, 'Etternavn er påkrevd'),
    email: emailValidator.optional(),
    mobileNumber: mobileNumberValidator.optional(),
  })
  .refine((data) => data.email || data.mobileNumber, {
    message: 'Enten mobilnummer eller e-post er påkrevd',
    path: ['email'],
  });

export type GetOrCreateContactSchema = z.infer<typeof getOrCreateContactSchema>;
