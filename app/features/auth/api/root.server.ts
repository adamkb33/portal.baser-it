import { redirect, type LoaderFunctionArgs } from 'react-router';
import { accessTokenCookie, refreshTokenCookie } from './cookies.server';
import { createNavigation, type UserNavigation } from '~/lib/route-tree';
import { toAuthTokens } from '../token/token-utils';
import { AuthControllerService, createBaseClient, UserRole, type AuthenticatedUserPayload } from '~/api/clients/base';
import { ENV } from '~/api/config/env';
import { OpenAPI } from '~/api/clients/http';
import { toAuthPayload, toJwtClaims } from '../token/token-payload';
import { data } from 'react-router';
import type { CompanySummaryDto } from 'tmp/openapi/gen/base';
import { getAuthPayloadFromRequest } from '~/lib/auth.utils';

export type RootLoaderLoaderData = {
  user?: AuthenticatedUserPayload | null;
  userNavigation?: UserNavigation;
  companyContext?: CompanySummaryDto | null;
};

export async function rootLoader({ request }: LoaderFunctionArgs) {
  console.log('[rootLoader] Starting');
  OpenAPI.BASE = ENV.BASE_SERVICE_BASE_URL;

  const cookieHeader = request.headers.get('Cookie');
  const accessToken = await accessTokenCookie.parse(cookieHeader);
  const refreshToken = await refreshTokenCookie.parse(cookieHeader);

  console.log('[rootLoader] Tokens parsed:', {
    hasAccessToken: !!accessToken,
    hasRefreshToken: !!refreshToken,
    url: request.url,
  });

  if (!refreshToken) {
    console.log('[rootLoader] No refresh token, returning default response');
    return defaultResponse();
  }

  if (!accessToken) {
    console.log('[rootLoader] No access token, refreshing');
    return refreshAndBuildResponse(request, refreshToken);
  }

  const isExpired = isTokenExpired(accessToken);
  console.log('[rootLoader] Token expiry check:', { isExpired });

  if (isExpired) {
    console.log('[rootLoader] Token expired or about to expire, refreshing');
    return refreshAndBuildResponse(request, refreshToken);
  }

  try {
    console.log('[rootLoader] Using existing valid token');
    const body = await buildResponseData(request, accessToken);
    console.log('[rootLoader] Response built successfully:', {
      hasUser: !!body.user,
      hasCompanyContext: !!body.companyContext,
    });
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
      console.log('[isTokenExpired] No exp claim in token');
      return true;
    }

    const expiresAt = jwt.exp * 1000;
    const now = Date.now();
    const bufferMs = 5 * 60 * 1000; // 5 minutes buffer
    const timeUntilExpiry = expiresAt - now;

    console.log('[isTokenExpired] Token expiry details:', {
      expiresAt: new Date(expiresAt).toISOString(),
      now: new Date(now).toISOString(),
      timeUntilExpiryMs: timeUntilExpiry,
      timeUntilExpiryMinutes: Math.round(timeUntilExpiry / 60000),
      isExpired: expiresAt <= now + bufferMs,
    });

    return expiresAt <= now + bufferMs;
  } catch (err) {
    console.error('[isTokenExpired] Failed to parse token:', err);
    return true;
  }
};

const refreshAndBuildResponse = async (request: Request, refreshToken: string) => {
  console.log('[refreshAndBuildResponse] Starting token refresh');

  try {
    const existingToken = await getAuthPayloadFromRequest(request);
    console.log('[refreshAndBuildResponse] Existing token payload:', {
      hasToken: !!existingToken,
      companyId: existingToken?.company?.companyId,
    });

    console.log('[refreshAndBuildResponse] Calling refresh API');
    const response = await AuthControllerService.refresh({
      companyId: existingToken?.company?.companyId,
      requestBody: { refreshToken },
    });

    console.log('[refreshAndBuildResponse] Refresh API response:', {
      success: response.success,
      hasData: !!response.data,
    });

    if (!response.success || !response.data) {
      throw new Error('Failed to refresh auth tokens');
    }

    const tokens = toAuthTokens(response.data);
    const authPayload = toAuthPayload(tokens.accessToken);

    console.log('[refreshAndBuildResponse] New tokens created:', {
      accessTokenExpiresAt: new Date(tokens.accessTokenExpiresAt * 1000).toISOString(),
      refreshTokenExpiresAt: new Date(tokens.refreshTokenExpiresAt * 1000).toISOString(),
    });

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
    console.log('[refreshAndBuildResponse] Company user check:', {
      isCompanyUser,
      hasCompany: !!authPayload?.company,
      pathname: url.pathname,
    });

    if (!authPayload?.company && isCompanyUser) {
      if (url.pathname === '/company-context') {
        console.log('[refreshAndBuildResponse] On company-context page, returning without redirect');
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

      console.log('[refreshAndBuildResponse] Redirecting to company-context with headers');
      return redirect('/company-context', { headers });
    }

    console.log('[refreshAndBuildResponse] Building response data with new token');
    const body = await buildResponseData(request, tokens.accessToken);

    console.log('[refreshAndBuildResponse] Refresh complete, returning response');
    return data(body, { headers });
  } catch (err) {
    console.error('[refreshAndBuildResponse] Refresh error:', err);
    return defaultResponse();
  }
};

const buildResponseData = async (request: Request, accessToken: string): Promise<RootLoaderLoaderData> => {
  console.log('[buildResponseData] Starting');

  const authPayload = toAuthPayload(accessToken);
  const navigation = createNavigation(authPayload);
  const url = new URL(request.url);

  console.log('[buildResponseData] Auth payload:', {
    userId: authPayload?.id,
    email: authPayload?.email,
    roles: authPayload?.roles,
    hasCompany: !!authPayload?.company,
    companyId: authPayload?.company?.companyId,
  });

  // Check if user needs to select company context (only when using existing token, not after refresh)
  const isCompanyUser = authPayload?.roles.includes(UserRole.COMPANY_USER);
  console.log('[buildResponseData] Company user check:', {
    isCompanyUser,
    hasCompany: !!authPayload?.company,
    pathname: url.pathname,
  });

  if (!authPayload?.company && isCompanyUser) {
    if (url.pathname === '/company-context') {
      console.log('[buildResponseData] On company-context page, returning without redirect');
      return {
        user: authPayload,
        userNavigation: navigation,
        companyContext: null,
      };
    }

    console.log('[buildResponseData] Redirecting to company-context (no headers - using existing token)');
    throw redirect('/company-context');
  }

  // Fetch company summary if user has company context
  let companySummary = null;
  if (authPayload?.company) {
    console.log('[buildResponseData] Fetching company summary for companyId:', authPayload.company.companyId);

    const baseClient = createBaseClient({
      baseUrl: ENV.BASE_SERVICE_BASE_URL,
      token: accessToken,
    });

    try {
      const companyResponse = await baseClient.AdminCompanyControllerService.AdminCompanyControllerService.getCompany({
        companyId: authPayload.company.companyId,
      });

      companySummary = companyResponse?.data;
      console.log('[buildResponseData] Company summary fetched:', {
        hasData: !!companySummary,
        companyName: companySummary?.name,
      });
    } catch (err) {
      console.error('[buildResponseData] Failed to fetch company summary:', err);
    }
  }

  console.log('[buildResponseData] Returning response data');
  return {
    user: authPayload,
    userNavigation: navigation,
    companyContext: companySummary,
  };
};

const defaultResponse = async () => {
  console.log('[defaultResponse] Returning default unauthenticated response');
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
  console.log('[clearAuthCookies] Clearing auth cookies');
  const accessCookie = await accessTokenCookie.serialize('', { expires: new Date(0) });
  const refreshCookie = await refreshTokenCookie.serialize('', { expires: new Date(0) });

  const headers = new Headers();
  headers.append('Set-Cookie', accessCookie);
  headers.append('Set-Cookie', refreshCookie);

  return headers;
}
