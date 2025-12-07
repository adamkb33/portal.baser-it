import { redirect, type LoaderFunctionArgs } from 'react-router';
import { accessTokenCookie, refreshTokenCookie } from '../auth/_features/auth.cookies.server';
import { createNavigation, type UserNavigation } from '~/lib/route-tree';
import { AuthControllerService, createBaseClient, UserRole, type AuthenticatedUserPayload } from '~/api/clients/base';
import { ENV } from '~/api/config/env';
import { OpenAPI } from '~/api/clients/http';
import { toAuthPayload, toJwtClaims } from '../auth/_utils/token-payload';
import { data } from 'react-router';
import type { CompanySummaryDto } from 'tmp/openapi/gen/base';
import { getAuthPayloadFromRequest } from '~/lib/auth.utils';
import { toAuthTokens } from '../auth/_utils/token.utils';

export type RootLoaderLoaderData = {
  user?: AuthenticatedUserPayload | null;
  userNavigation?: UserNavigation;
  companyContext?: CompanySummaryDto | null;
};

export async function rootLoader({ request }: LoaderFunctionArgs) {
  OpenAPI.BASE = ENV.BASE_SERVICE_BASE_URL;

  const cookieHeader = request.headers.get('Cookie');
  const accessToken = await accessTokenCookie.parse(cookieHeader);
  const refreshToken = await refreshTokenCookie.parse(cookieHeader);

  if (!refreshToken) {
    return defaultResponse();
  }

  if (!accessToken) {
    return refreshAndBuildResponse(request, refreshToken);
  }

  const isExpired = isTokenExpired(accessToken);

  if (isExpired) {
    return refreshAndBuildResponse(request, refreshToken);
  }

  try {
    const body = await buildResponseData(request, accessToken);
    return data(body);
  } catch (err) {
    console.error('[rootLoader] Failed to use access token:', err);
    return refreshAndBuildResponse(request, refreshToken);
  }
}

const isTokenExpired = (accessToken: string): boolean => {
  try {
    const jwt = toJwtClaims(accessToken);
    if (!jwt.exp) {
      return true;
    }

    const expiresAt = jwt.exp * 1000;
    const now = Date.now();
    const bufferMs = 5 * 60 * 1000;
    return expiresAt <= now + bufferMs;
  } catch (err) {
    console.error('[isTokenExpired] Failed to parse token:', err);
    return true;
  }
};

const refreshAndBuildResponse = async (request: Request, refreshToken: string) => {
  try {
    const existingToken = await getAuthPayloadFromRequest(request);

    const response = await AuthControllerService.refresh({
      companyId: existingToken?.company?.companyId,
      requestBody: { refreshToken },
    });

    if (!response.success || !response.data) {
      throw new Error('Failed to refresh auth tokens');
    }

    const tokens = toAuthTokens(response.data);
    const authPayload = toAuthPayload(tokens.accessToken);

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

    // Check if user needs to select company context
    const isCompanyUser = authPayload?.roles.includes(UserRole.COMPANY_USER);

    if (!authPayload?.company && isCompanyUser) {
      if (url.pathname === '/company-context') {
        return data(
          {
            user: authPayload,
            userNavigation: navigation,
            companyContext: null,
          },
          {
            headers,
          },
        );
      }

      return redirect('/company-context', { headers });
    }

    const body = await buildResponseData(request, tokens.accessToken);

    return data(body, { headers });
  } catch (err) {
    console.error('[refreshAndBuildResponse] Refresh error:', err);
    return defaultResponse();
  }
};

const buildResponseData = async (request: Request, accessToken: string): Promise<RootLoaderLoaderData> => {
  const authPayload = toAuthPayload(accessToken);
  const navigation = createNavigation(authPayload);
  const url = new URL(request.url);

  // Check if user needs to select company context (only when using existing token, not after refresh)
  const isCompanyUser = authPayload?.roles.includes(UserRole.COMPANY_USER);

  if (!authPayload?.company && isCompanyUser) {
    if (url.pathname === '/company-context') {
      return {
        user: authPayload,
        userNavigation: navigation,
        companyContext: null,
      };
    }

    throw redirect('/company-context');
  }

  // Fetch company summary if user has company context
  let companySummary = null;
  if (authPayload?.company) {
    const baseClient = createBaseClient({
      baseUrl: ENV.BASE_SERVICE_BASE_URL,
      token: accessToken,
    });

    try {
      const companyResponse = await baseClient.CompanyUserControllerService.CompanyUserControllerService.getCompany({
        companyId: authPayload.company.companyId,
      });

      companySummary = companyResponse?.data;
    } catch (err) {
      console.error('[buildResponseData] Failed to fetch company summary:', err);
    }
  }

  return {
    user: authPayload,
    userNavigation: navigation,
    companyContext: companySummary,
  };
};

const defaultResponse = async () => {
  const headers = await clearAuthCookies();
  return data(
    {
      user: null,
      companyContext: null,
      userNavigation: createNavigation(),
    },
    {
      status: 200,
      headers,
    },
  );
};

async function clearAuthCookies(): Promise<Headers> {
  const accessCookie = await accessTokenCookie.serialize('', { expires: new Date(0) });
  const refreshCookie = await refreshTokenCookie.serialize('', { expires: new Date(0) });

  const headers = new Headers();
  headers.append('Set-Cookie', accessCookie);
  headers.append('Set-Cookie', refreshCookie);

  return headers;
}
