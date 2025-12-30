import { data } from 'react-router';
import { createNavigation } from '~/lib/route-tree';
import { authService } from '~/lib/auth-service';
import { logger } from '~/lib/logger';
import type { FlashMessage } from '~/routes/company/_lib/flash-message.server';
import { AuthController, CompanyUserController } from '~/api/generated/identity';
import { client } from '~/api/generated/identity/client.gen';

export const refreshAndBuildResponse = async (
  request: Request,
  refreshToken: string,
  flashMessage: FlashMessage | null,
) => {
  try {
    const { accessToken } = await authService.getTokensFromRequest(request);
    const companyId = authService.getCompanyIdFromToken(accessToken ?? '');

    const response = await AuthController.refresh({
      query: { companyId },
      body: { refreshToken },
    });

    const tokens = response.data?.data;

    if (!tokens) {
      throw new Error('Failed to refresh auth tokens');
    }

    const { headers } = await authService.processTokenRefresh(tokens);
    const body = await buildResponseData(request, tokens.accessToken, flashMessage);

    return data(body, { headers });
  } catch (err) {
    logger.error('Token refresh failed', { error: err instanceof Error ? err.message : String(err) });
    return await defaultResponse(flashMessage);
  }
};

export const buildResponseData = async (request: Request, accessToken: string, flashMessage: FlashMessage | null) => {
  const authPayload = authService.verifyAndDecodeToken(accessToken);

  let userCompany = undefined;
  let companySummary = undefined;
  let company = undefined;

  if (authPayload) {
    const userCompanyResponse = await CompanyUserController.getUser1({
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    userCompany = userCompanyResponse.data?.data;
  }

  if (authPayload?.companyId) {
    client.setConfig({
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    try {
      const companySummaryResponse = await CompanyUserController.getCompanySummary();
      companySummary = companySummaryResponse.data?.data;

      const companyResponse = await CompanyUserController.getCompany();
      company = companyResponse.data?.data;
    } catch (err) {
      logger.error('Failed to fetch company summary', {
        companyId: authPayload.companyId,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  const navigation = createNavigation(authPayload, userCompany, company);

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
