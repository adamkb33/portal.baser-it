import type { AuthenticatedUserPayload } from 'tmp/openapi/gen/identity';
import { accessTokenCookie } from '~/features/auth/api/cookies.server';
import { toAuthPayload } from '~/features/auth/token/token-payload';

export const getAuthPayloadFromRequest = async (request: Request): Promise<AuthenticatedUserPayload | null> => {
  const cookieHeader = request.headers.get('Cookie');
  const accessToken = await accessTokenCookie.parse(cookieHeader);
  const authPayload = accessToken ? toAuthPayload(accessToken) : null;
  return authPayload;
};
