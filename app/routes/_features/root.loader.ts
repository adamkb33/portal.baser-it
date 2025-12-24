import { data } from 'react-router';
import { createNavigation, ROUTES_MAP, type UserNavigation } from '~/lib/route-tree';
import { AuthControllerService, createBaseClient, UserRole } from '~/api/clients/base';
import { ENV } from '~/api/config/env';
import { authService } from '~/lib/auth-service';
import { logger } from '~/lib/logger';
import type { FlashMessage } from '~/routes/company/_lib/flash-message.server';

export const refreshAndBuildResponse = async (
  request: Request,
  refreshToken: string,
  flashMessage: FlashMessage | null,
) => {
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
    const body = await buildResponseData(request, response.data.accessToken, flashMessage);

    return data(body, { headers });
  } catch (err) {
    logger.error('Token refresh failed', { error: err instanceof Error ? err.message : String(err) });
    return await defaultResponse(flashMessage);
  }
};

export const buildResponseData = async (request: Request, accessToken: string, flashMessage: FlashMessage | null) => {
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
        flashMessage,
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
    flashMessage,
  };
};

export const defaultResponse = async (flashMessage: FlashMessage | null = null) => {
  const headers = await authService.clearAuthCookies();
  return data(
    {
      user: null,
      companyContext: null,
      userNavigation: createNavigation(),
      flashMessage,
    },
    { status: 200, headers },
  );
};
