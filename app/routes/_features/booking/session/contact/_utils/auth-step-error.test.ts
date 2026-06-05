import { describe, expect, it } from 'vitest';
import { extractAuthErrorCode, mapAuthErrorCodeToMessage } from './auth-step-error';

describe('auth-step-error', () => {
  it('extracts message id from axios-like response payload', () => {
    const code = extractAuthErrorCode({
      response: {
        data: {
          message: {
            id: 'MOBILE_ALREADY_IN_USE',
          },
        },
      },
    });

    expect(code).toBe('MOBILE_ALREADY_IN_USE');
  });

  it.each([
    ['MOBILE_ALREADY_IN_USE', 'Dette mobilnummeret er allerede i bruk.'],
    ['EMAIL_ALREADY_IN_USE', 'Denne e-posten er allerede i bruk.'],
    ['AUTH_PROVIDER_MISMATCH_GOOGLE', 'Denne brukeren må logge inn med Google.'],
    ['AUTH_PROVIDER_MISMATCH_FACEBOOK', 'Denne brukeren må logge inn med Facebook.'],
    ['AUTH_PROVIDER_MISMATCH_LOCAL', 'Denne brukeren må logge inn med e-post og passord.'],
    ['OTP_INVALID', 'Koden er ugyldig. Prøv igjen.'],
    ['OTP_EXPIRED', 'Koden har utløpt. Be om ny kode.'],
    ['INVALID_TOKEN', 'Verifiseringslenken er ugyldig. Be om ny e-post.'],
    ['TOKEN_EXPIRED', 'Verifiseringslenken har utløpt. Be om ny e-post.'],
  ])('maps %s to user-facing message', (code, expected) => {
    expect(mapAuthErrorCodeToMessage(code, 'fallback')).toBe(expected);
  });
});

