import type { AuthenticatedUserPayload } from 'tmp/openapi/gen/base';
import { accessTokenCookie, companyContextCookie } from '~/features/auth/api/cookies.server';
import { toAuthPayload } from '~/features/auth/token/token-payload';

export const getAuthPayloadFromRequest = async (request: Request): Promise<AuthenticatedUserPayload | null> => {
  const cookieHeader = request.headers.get('Cookie');
  const accessToken = await accessTokenCookie.parse(cookieHeader);
  const authPayload = accessToken ? toAuthPayload(accessToken) : null;
  return authPayload;
};

export type UserSesion = {
  companyId: number | null;
  user: AuthenticatedUserPayload | null;
  accesstoken: string;
};

export const getUserSession = async (request: Request): Promise<UserSesion> => {
  const cookieHeader = request.headers.get('Cookie');
  const accessToken = await accessTokenCookie.parse(cookieHeader);
  const authPayload = accessToken ? toAuthPayload(accessToken) : null;
  const companyContext = await companyContextCookie.parse(cookieHeader);
  return {
    accesstoken: accessToken,
    companyId: companyContext,
    user: authPayload,
  };
};
