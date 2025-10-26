import { redirect, type LoaderFunctionArgs } from 'react-router';
import { accessTokenCookie, companyContextCookie, refreshTokenCookie } from './cookies.server';
import {
  BrachCategory,
  createNavigation,
  type BranchGroup,
  type RouteBranch,
  type UserNavigation,
} from '~/lib/nav/route-tree';
import { toAuthTokens } from '../token/token-utils';
import { AuthControllerService, createIdentityClient, type AuthenticatedUserPayload } from '~/api/clients/identity';
import { ENV } from '~/api/config/env';
import { OpenAPI } from '~/api/clients/http';
import { toAuthPayload } from '../token/token-payload';
import { data } from 'react-router';
import type { CompanySummaryDto } from 'tmp/openapi/gen/identity';

export type RootLoaderLoaderData = {
  user?: AuthenticatedUserPayload | null;
  userNavigation?: UserNavigation;
  companyContext?: CompanySummaryDto | null;
};

export async function rootLoader({ request }: LoaderFunctionArgs) {
  const cookieHeader = request.headers.get('Cookie');
  const refreshToken = await refreshTokenCookie.parse(cookieHeader);

  const defaultResponse = async () => {
    const headers = await clearAuthCookies();
    const body: RootLoaderLoaderData = {
      user: null,
      companyContext: null,
      userNavigation: createNavigation(),
    };
    return data(body, {
      status: 200,
      headers,
    });
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

    const companyCookie = await companyContextCookie.parse(cookieHeader);

    const accessCookie = await accessTokenCookie.serialize(tokens.accessToken, {
      expires: new Date(tokens.accessTokenExpiresAt * 1000),
    });
    const refreshCookie = await refreshTokenCookie.serialize(tokens.refreshToken, {
      expires: new Date(tokens.refreshTokenExpiresAt * 1000),
    });

    const headers = new Headers();
    headers.append('Set-Cookie', accessCookie);
    headers.append('Set-Cookie', refreshCookie);

    const navigation = createNavigation(authPayload);

    const url = new URL(request.url);

    const userHasCompanyRoles = authPayload?.companyRoles.length ?? 0 > 0;

    if (!companyCookie && userHasCompanyRoles) {
      if (url.pathname === '/companies') {
        return data(
          {
            user: authPayload,
            userNavigation: navigation,
          },
          {
            headers,
          },
        );
      }

      return redirect('/companies', { headers });
    }

    const identityClient = createIdentityClient({ baseUrl: ENV.IDENTITY_BASE_URL, token: tokens.accessToken });
    const companySummary = await identityClient.AdminCompanyControllerService.AdminCompanyControllerService.getCompany({
      companyId: companyCookie,
    });

    const body: RootLoaderLoaderData = {
      user: authPayload,
      userNavigation: navigation,
      companyContext: companySummary.data,
    };

    return data(body, {
      headers,
    });
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
