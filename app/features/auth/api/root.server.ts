import { type LoaderFunctionArgs } from 'react-router';
import { accessTokenCookie, refreshTokenCookie } from './cookies.server';
import { createNavigation, type RouteBranch } from '~/lib/nav/route-tree';
import { toAuthTokens } from '../token/token-utils';
import { AuthControllerService, type AuthenticatedUserPayload } from '~/api/clients/identity';
import { ENV } from '~/api/config/env';
import { OpenAPI } from '~/api/clients/http';
import { toAuthPayload } from '../token/token-payload';

export type RootLoaderLoaderData = {
  user: AuthenticatedUserPayload | null;
  userNavigation: RouteBranch[];
};

export async function rootLoader({ request }: LoaderFunctionArgs): Promise<Response> {
  const cookieHeader = request.headers.get('Cookie');
  const refreshToken = await refreshTokenCookie.parse(cookieHeader);

  const defaultResponse = async (): Promise<Response> => {
    const headers = await clearAuthCookies();
    const body: RootLoaderLoaderData = {
      user: null,
      userNavigation: createNavigation(),
    };
    return jsonResponse(body, headers);
  };

  if (!refreshToken) {
    return defaultResponse();
  }

  try {
    OpenAPI.BASE = ENV.IDENTITY_BASE_URL;

    const response = await AuthControllerService.refresh({
      requestBody: { refreshToken },
    });

    if (!response.success || !response.data) {
      throw new Error('Failed to refresh auth tokens');
    }

    const tokens = toAuthTokens(response.data);
    const authPayload = toAuthPayload(tokens.accessToken);
    const navigation = createNavigation(authPayload);

    const accessCookie = await accessTokenCookie.serialize(tokens.accessToken, {
      expires: new Date(tokens.accessTokenExpiresAt * 1000),
    });
    const refreshCookie = await refreshTokenCookie.serialize(tokens.refreshToken, {
      expires: new Date(tokens.refreshTokenExpiresAt * 1000),
    });

    const headers = new Headers();
    headers.append('Set-Cookie', accessCookie);
    headers.append('Set-Cookie', refreshCookie);

    const body: RootLoaderLoaderData = {
      user: authPayload,
      userNavigation: navigation,
    };

    return jsonResponse(body, headers);
  } catch (err) {
    console.error('rootLoader error:', err);
    return defaultResponse();
  }
}

async function clearAuthCookies(): Promise<Headers> {
  const accessCookie = await accessTokenCookie.serialize('', { expires: new Date(0) });
  const refreshCookie = await refreshTokenCookie.serialize('', { expires: new Date(0) });

  const headers = new Headers();
  headers.append('Set-Cookie', accessCookie);
  headers.append('Set-Cookie', refreshCookie);

  return headers;
}

function jsonResponse(data: RootLoaderLoaderData, headers: Headers = new Headers()): Response {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: {
      ...Object.fromEntries(headers.entries()),
      'Content-Type': 'application/json',
    },
  });
}
