import { data } from 'react-router';
import { createNavigation } from '~/lib/route-tree';
import { authService } from '~/lib/auth-service';
import { logger } from '~/lib/logger';
import type { FlashMessage } from '~/routes/company/_lib/flash-message.server';
import { AuthController } from '~/api/generated/base';
import type { UserContextDto } from '~/api/generated/base';
import { withAuth } from '~/api/utils/with-auth';
import { readEmbedModeFromCookieString, readEmbedThemeFromCookieString } from '~/lib/embed-shell';

function mergeResponseHeaders(...headersInit: Array<HeadersInit | undefined>): Headers {
  const merged = new Headers();

  for (const init of headersInit) {
    if (!init) continue;

    if (init instanceof Headers) {
      for (const [key, value] of init.entries()) {
        merged.append(key, value);
      }
      continue;
    }

    if (Array.isArray(init)) {
      for (const [key, value] of init) {
        merged.append(key, value);
      }
      continue;
    }

    for (const [key, value] of Object.entries(init)) {
      if (value !== undefined) {
        merged.append(key, value);
      }
    }
  }

  return merged;
}

function isEmbeddedRequest(request: Request): boolean {
  return request.headers.get('sec-fetch-dest') === 'iframe';
}

export const refreshAndBuildResponse = async (
  request: Request,
  refreshToken: string,
  flashMessage: FlashMessage | null,
  additionalHeaders?: HeadersInit,
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

    return data(body, { headers: mergeResponseHeaders(headers, additionalHeaders) });
  } catch (err) {
    logger.error('Token refresh failed', { error: err instanceof Error ? err.message : String(err) });
    return await defaultResponse(flashMessage, request, additionalHeaders);
  }
};

export const buildResponseData = async (request: Request, accessToken: string, flashMessage: FlashMessage | null) => {
  const authPayload = authService.verifyAndDecodeToken(accessToken);
  let userContext: UserContextDto | undefined = undefined;
  let companySummary = undefined;

  if (authPayload) {
    await withAuth(
      request,
      async () => {
        try {
          const userContextResponse = await AuthController.getUserContext();
          userContext = userContextResponse.data?.data ?? undefined;
        } catch (err) {
          logger.info('Failed to fetch user context', {
            userId: authPayload.id,
            error: err instanceof Error ? err.message : String(err),
          });
          userContext = undefined;
        }
      },
      accessToken,
    );
  }

  const companyContexts = (userContext as UserContextDto | undefined)?.companies ?? [];
  if (authPayload?.companyId && companyContexts.length > 0) {
    companySummary = companyContexts.find((entry) => entry.company.id === authPayload.companyId)?.company;
  }

  const navigation = createNavigation(userContext);
  const cookieHeader = request.headers.get('Cookie') ?? '';

  return {
    user: authPayload,
    userNavigation: navigation,
    companyContext: companySummary,
    flashMessage,
    embedMode: readEmbedModeFromCookieString(cookieHeader),
    embedTheme: readEmbedThemeFromCookieString(cookieHeader),
    isEmbeddedRequest: isEmbeddedRequest(request),
  };
};

export const defaultResponse = async (
  flashMessage: FlashMessage | null = null,
  request?: Request,
  additionalHeaders?: HeadersInit,
) => {
  const authHeaders = await authService.clearAuthCookies();
  const headers = mergeResponseHeaders(authHeaders, additionalHeaders);
  const cookieHeader = request?.headers.get('Cookie') ?? '';
  return data(
    {
      user: null,
      companyContext: null,
      userNavigation: createNavigation(undefined),
      flashMessage,
      embedMode: readEmbedModeFromCookieString(cookieHeader),
      embedTheme: readEmbedThemeFromCookieString(cookieHeader),
      isEmbeddedRequest: request ? isEmbeddedRequest(request) : false,
    },
    { status: 200, headers },
  );
};
