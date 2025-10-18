import type { LoaderFunctionArgs } from 'react-router';
import { accessTokenCookie, refreshTokenCookie } from './cookies.server';
import { ApiClientError, OpenAPI } from '~/api/clients/http';
import { ENV } from '~/api/config/env';
import { AuthControllerService } from '~/api/clients/identity';
import { toAuthTokens } from '../token/token-utils';
import { data } from 'react-router';

export async function rootLoader({ request }: LoaderFunctionArgs) {
  const cookieHeader = request.headers.get('Cookie');
  const refresh = await refreshTokenCookie.parse(cookieHeader);

  if (refresh) {
    try {
      OpenAPI.BASE = ENV.IDENTITY_BASE_URL;

      const response = await AuthControllerService.refresh({
        requestBody: {
          refreshToken: refresh,
        },
      });

      if (!response.success || !response.data) {
        throw new Error();
      }

      const tokens = toAuthTokens(response.data);

      const accessCookie = await accessTokenCookie.serialize(tokens.accessToken, {
        expires: new Date(tokens.accessTokenExpiresAt * 1000),
      });
      const refreshCookie = await refreshTokenCookie.serialize(tokens.refreshToken, {
        expires: new Date(tokens.refreshTokenExpiresAt * 1000),
      });

      return data(null, {
        headers: [
          ['Set-Cookie', accessCookie],
          ['Set-Cookie', refreshCookie],
        ],
      });
    } catch (error: any) {
      const accessCookie = await accessTokenCookie.serialize('', {
        expires: new Date(0),
      });
      const refreshCookie = await refreshTokenCookie.serialize('', {
        expires: new Date(0),
      });

      if (error as ApiClientError) {
        return data(null, {
          headers: [
            ['Set-Cookie', accessCookie],
            ['Set-Cookie', refreshCookie],
          ],
        });
      }

      throw error;
    }
  }

  return 'Not implemented';
}
