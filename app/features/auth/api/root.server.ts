import type { LoaderFunctionArgs } from 'react-router';
import { accessTokenCookie, refreshTokenCookie } from './cookies.server';
import { ApiClientError, OpenAPI } from '~/api/clients/http';
import { ENV } from '~/api/config/env';
import { AuthControllerService, type AuthenticatedUserPayload } from '~/api/clients/identity';
import { toAuthTokens } from '../token/token-utils';
import { data } from 'react-router';
import { toAuthPayload } from '../token/token-payload';

export async function rootLoader({ request }: LoaderFunctionArgs) {
  const cookieHeader = request.headers.get('Cookie');
  const refresh = await refreshTokenCookie.parse(cookieHeader);

  if (refresh) {
    return await handleRefreshToken(refresh);
  }

  return { user: null };
}

const handleRefreshToken = async (refreshToken: string) => {
  try {
    OpenAPI.BASE = ENV.IDENTITY_BASE_URL;

    const response = await AuthControllerService.refresh({
      requestBody: {
        refreshToken: refreshToken,
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

    const authPayload = toAuthPayload(tokens.accessToken);

    return data(
      { user: authPayload },
      {
        headers: [
          ['Set-Cookie', accessCookie],
          ['Set-Cookie', refreshCookie],
        ],
      },
    );
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
};
