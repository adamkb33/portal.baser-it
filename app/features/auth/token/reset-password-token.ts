import { decodeBase64Url } from './token-payload';

type ResetPasswordTokenClaims = {
  email?: string;
  exp?: number;
  [key: string]: unknown;
};

export function decodeResetPasswordToken(token: string): ResetPasswordTokenClaims | null {
  const parts = token.split('.');
  if (parts.length !== 3) {
    return null;
  }

  const payload = decodeBase64Url(parts[1]);
  if (!payload) {
    return null;
  }

  try {
    const claims = JSON.parse(payload) as ResetPasswordTokenClaims;

    // Validate token is not expired
    if (claims.exp && claims.exp < Math.floor(Date.now() / 1000)) {
      if (import.meta.env.DEV) {
        console.warn('Reset password token has expired');
      }
      return null;
    }

    return claims;
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('Failed to parse reset password token payload', error);
    }
    return null;
  }
}

export type { ResetPasswordTokenClaims };
