import type { AuthenticatedUserPayload, CompanyRoleDto, UserRole } from '~/api/clients/types';
import type { AuthTokens } from './types';

type AccessTokenClaims = {
  sub?: string | number;
  email?: string;
  roles?: UserRole[] | string[];
  companyRoles?: CompanyRoleDto[] | Array<{ companyId: number; role: string }>;
  userId?: string | number;
  id?: string | number;
  [key: string]: unknown;
};

export function tokensToAuthenticatedPayload(tokens: AuthTokens | null): AuthenticatedUserPayload | null {
  if (!tokens?.accessToken) {
    return null;
  }

  const claims = decodeAccessToken(tokens.accessToken);
  if (!claims) {
    return null;
  }

  const id = parseIdentifier(claims);
  const email = typeof claims.email === 'string' ? claims.email : '';
  const roles = normalizeRoles(claims.roles);
  const companyRoles = normalizeCompanyRoles(claims.companyRoles);

  return {
    id,
    email,
    roles,
    companyRoles,
  };
}

function decodeAccessToken(token: string): AccessTokenClaims | null {
  const parts = token.split('.');
  if (parts.length < 2) {
    return null;
  }

  const payload = decodeBase64Url(parts[1]);
  if (!payload) {
    return null;
  }

  try {
    return JSON.parse(payload) as AccessTokenClaims;
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('Failed to parse access token payload', error);
    }
    return null;
  }
}

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

function parseIdentifier(claims: AccessTokenClaims): number {
  const raw = claims.userId ?? claims.sub ?? claims.id ?? 0;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeRoles(roles: AccessTokenClaims['roles']): UserRole[] {
  if (!Array.isArray(roles)) {
    return [];
  }

  return roles.filter((role): role is UserRole => typeof role === 'string');
}

function normalizeCompanyRoles(
  companyRoles: AccessTokenClaims['companyRoles'],
): CompanyRoleDto[] {
  if (!Array.isArray(companyRoles)) {
    return [];
  }

  return companyRoles
    .filter(
      (entry): entry is { companyId: number; role: string } =>
        !!entry &&
        typeof entry === 'object' &&
        typeof entry.companyId === 'number' &&
        typeof entry.role === 'string',
    )
    .map(
      (entry): CompanyRoleDto => ({
        companyId: entry.companyId,
        role: entry.role as CompanyRoleDto['role'],
      }),
    );
}

export type { AccessTokenClaims };
