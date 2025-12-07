import { z } from 'zod';

export const ContactFormSchema = z.object({
  givenName: z.string().min(1, 'Fornavn er påkrevd').max(100, 'Maks 100 tegn'),
  familyName: z.string().min(1, 'Etternavn er påkrevd').max(100, 'Maks 100 tegn'),
  email: z.string().trim().email('Ugyldig e‑postadresse').optional().or(z.literal('')),
  mobileNumber: z
    .string()
    .trim()
    .regex(/^$|^\+?\d{6,15}$/u, 'Ugyldig mobilnummer')
    .optional()
    .or(z.literal('')),
});

export type ContactFormData = {
  id?: number;
  givenName: string;
  familyName: string;
  email?: string;
  mobileNumber?: string;
};

export type FieldErrors = Partial<Record<keyof ContactFormData, string>>;