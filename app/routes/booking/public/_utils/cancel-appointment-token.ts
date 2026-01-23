type CancelAppointmentTokenClaims = {
  appointmentId: number;
  expiresAt: number;
  token?: string;
  exp?: number;
  [key: string]: unknown;
};

export function decodeCancelAppointmentToken(cancelToken: string): CancelAppointmentTokenClaims | null {
  const parts = cancelToken.split('.');
  if (parts.length < 2) {
    return null;
  }

  const payload = decodeBase64Url(parts[1]);
  if (!payload) {
    return null;
  }

  try {
    const claims = JSON.parse(payload) as CancelAppointmentTokenClaims;

    if (!Number.isFinite(claims.appointmentId) || !Number.isFinite(claims.expiresAt)) {
      return null;
    }

    if (claims.exp && claims.exp < Math.floor(Date.now() / 1000)) {
      if (import.meta.env.DEV) {
        console.warn('Cancel appointment token has expired');
      }
      return null;
    }

    return {
      ...claims,
      token: claims.token ?? cancelToken,
    };
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('Failed to parse cancel appointment token payload', error);
    }
    return null;
  }
}

export type { CancelAppointmentTokenClaims };

function decodeBase64Url(segment: string): string | null {
  const padded = padBase64(segment.replace(/-/g, '+').replace(/_/g, '/'));

  try {
    if (typeof window === 'undefined') {
      if (typeof Buffer !== 'undefined') {
        return Buffer.from(padded, 'base64').toString('utf-8');
      }
      return null;
    }

    const binary = window.atob(padded);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));

    if (typeof TextDecoder !== 'undefined') {
      return new TextDecoder().decode(bytes);
    }

    return binary;
  } catch {
    return null;
  }
}

const padBase64 = (value: string) => {
  const remainder = value.length % 4;
  if (remainder === 0) return value;
  const padding = 4 - remainder;
  return value + '='.repeat(padding);
};
