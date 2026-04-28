import { client as baseClient } from '~/api/generated/base/client.gen';
import { client as bookingClient } from '~/api/generated/booking/client.gen';
import { client as timesheetClient } from '~/api/generated/timesheet/client.gen';
import { client as notificationClient } from '~/api/generated/notification/client.gen';
import { accessTokenCookie } from '~/routes/auth/_features/auth.cookies.server';
import { logger } from '~/lib/logger';

let authClientQueue: Promise<void> = Promise.resolve();

function setAuthorizationHeader(accessToken?: string) {
  const headers = accessToken
    ? {
        Authorization: `Bearer ${accessToken}`,
      }
    : {};

  baseClient.setConfig({ headers });
  bookingClient.setConfig({ headers });
  timesheetClient.setConfig({ headers });
  notificationClient.setConfig({ headers });
}

export async function withAuth<T>(request: Request, callback: () => Promise<T> | T, token?: string): Promise<T> {
  const run = async (): Promise<T> => {
    const cookieHeader = request.headers.get('Cookie');
    const accessToken = token || (await accessTokenCookie.parse(cookieHeader));

    logger.info('[with-auth] Preparing authenticated request context', {
      requestMethod: request.method,
      requestUrl: request.url,
      hasCookieHeader: Boolean(cookieHeader),
      hasAccessToken: Boolean(accessToken),
      tokenSource: token ? 'argument' : 'cookie',
    });

    // NOTE: Generated SDK clients are process singletons.
    // We serialize authenticated calls to avoid cross-request header races.
    setAuthorizationHeader(accessToken || undefined);

    try {
      const result = await callback();
      logger.info('[with-auth] Authenticated request completed', {
        requestMethod: request.method,
        requestUrl: request.url,
      });
      return result;
    } catch (error) {
      logger.error('[with-auth] Authenticated request failed', {
        requestMethod: request.method,
        requestUrl: request.url,
        error,
      });
      throw error;
    } finally {
      setAuthorizationHeader(undefined);
    }
  };

  const next = authClientQueue.then(run, run);
  authClientQueue = next.then(
    () => undefined,
    () => undefined,
  );
  return next;
}
