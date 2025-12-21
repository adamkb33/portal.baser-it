import { redirect, type LoaderFunctionArgs } from 'react-router';
import { createNavigation, ROUTES_MAP, type UserNavigation } from '~/lib/route-tree';
import { AuthControllerService, createBaseClient, UserRole, type AuthenticatedUserPayload } from '~/api/clients/base';
import { ENV } from '~/api/config/env';
import { OpenAPI } from '~/api/clients/http';
import { data } from 'react-router';
import type { CompanySummaryDto } from 'tmp/openapi/gen/base';
import { AuthenticationError, authService } from '~/lib/auth-service';
import { logger } from '~/lib/logger';

export type RootLoaderLoaderData = {
  user?: AuthenticatedUserPayload | null;
  userNavigation?: UserNavigation;
  companyContext?: CompanySummaryDto | null;
};

export async function rootLoader({ request }: LoaderFunctionArgs) {
  try {
    OpenAPI.BASE = ENV.BASE_SERVICE_BASE_URL;
    const { accessToken, refreshToken } = await authService.getTokensFromRequest(request);

    if (!accessToken && !refreshToken) {
      return await defaultResponse();
    }

    if (!accessToken && refreshToken) {
      return await refreshAndBuildResponse(request, refreshToken);
    }

    if (accessToken) {
      if (authService.isTokenExpired(accessToken)) {
        if (refreshToken) {
          return refreshAndBuildResponse(request, refreshToken);
        }
        return await defaultResponse();
      }
      return await buildResponseData(request, accessToken);
    }

    return await defaultResponse();
  } catch (error) {
    if (error instanceof Response) {
      throw error;
    }

    logger.error('Root loader failed', { error: error instanceof Error ? error.message : String(error) });
    if (error instanceof AuthenticationError) {
      return await defaultResponse();
    }

    throw error;
  }
}

const refreshAndBuildResponse = async (request: Request, refreshToken: string) => {
  try {
    const { accessToken } = await authService.getTokensFromRequest(request);
    const companyId = authService.getCompanyIdFromToken(accessToken ?? '');

    const response = await AuthControllerService.refresh({
      companyId,
      requestBody: { refreshToken },
    });

    if (!response.success || !response.data) {
      throw new Error('Failed to refresh auth tokens');
    }

    const { headers } = await authService.processTokenRefresh(response.data);

    const body = await buildResponseData(request, response.data.accessToken);
    return data(body, { headers });
  } catch (err) {
    logger.error('Token refresh failed', { error: err instanceof Error ? err.message : String(err) });
    return await defaultResponse();
  }
};

const buildResponseData = async (request: Request, accessToken: string): Promise<RootLoaderLoaderData> => {
  const authPayload = authService.verifyAndDecodeToken(accessToken);
  const navigation = createNavigation(authPayload);
  const url = new URL(request.url);

  const isCompanyUser = authPayload?.roles.includes(UserRole.COMPANY_USER);
  if (!authPayload?.company && isCompanyUser) {
    if (url.pathname === ROUTES_MAP['user.company-context'].href) {
      return {
        user: authPayload,
        userNavigation: navigation,
        companyContext: null,
      };
    }
  }

  let companySummary = undefined;
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
      logger.error('Failed to fetch company summary', {
        companyId: authPayload.company.companyId,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return {
    user: authPayload,
    userNavigation: navigation,
    companyContext: companySummary,
  };
};

const defaultResponse = async () => {
  const headers = await authService.clearAuthCookies();
  return data(
    {
      user: null,
      companyContext: null,
      userNavigation: createNavigation(),
    },
    { status: 200, headers },
  );
};
