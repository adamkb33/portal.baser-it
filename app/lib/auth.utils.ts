import type { AuthenticatedUserPayload } from 'tmp/openapi/gen/base';
import { accessTokenCookie, companyContextCookie } from '~/features/auth/api/cookies.server';
import { toAuthPayload } from '~/features/auth/token/token-payload';

export type CompanyContextSession = {
  companyId: number;
  orgNumber: string;
};

export const getCompanyContextSession = async (request: Request): Promise<CompanyContextSession | null> => {
  const cookieHeader = request.headers.get('Cookie');
  const companyContext = await companyContextCookie.parse(cookieHeader);
  if (!companyContext) {
    return null;
  }
  return companyContext as CompanyContextSession;
};

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
  const companyContext: CompanyContextSession = await companyContextCookie.parse(cookieHeader);
  return {
    accesstoken: accessToken,
    companyId: companyContext.companyId,
    user: authPayload,
  };
};
