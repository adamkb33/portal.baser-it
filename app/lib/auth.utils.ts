import type { AuthenticatedUserPayload } from 'tmp/openapi/gen/base';
import { accessTokenCookie } from '~/features/auth/api/cookies.server';
import { toAuthPayload } from '~/features/auth/token/token-payload';

export type CompanyContextSession = {
  companyId: number;
  orgNumber: string;
};

export const getAuthPayloadFromRequest = async (request: Request): Promise<AuthenticatedUserPayload | null> => {
  const cookieHeader = request.headers.get('Cookie');
  const accessToken = await accessTokenCookie.parse(cookieHeader);
  const authPayload = accessToken ? toAuthPayload(accessToken) : null;
  return authPayload;
};

export const getAccessToken = async (request: Request) => {
  const cookieHeader = request.headers.get('Cookie');
  return await accessTokenCookie.parse(cookieHeader);
};

export type UserSesion = {
  user: AuthenticatedUserPayload | null;
  accessToken: string;
};

export const getUserSession = async (request: Request): Promise<UserSesion> => {
  const cookieHeader = request.headers.get('Cookie');
  const accessToken = await accessTokenCookie.parse(cookieHeader);
  const authPayload = accessToken ? toAuthPayload(accessToken) : null;
  return {
    accessToken: accessToken,
    user: authPayload,
  };
};
