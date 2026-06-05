import { redirect, type ActionFunctionArgs } from 'react-router';
import { resolveErrorPayload } from '~/lib/api-error';
import { logger } from '~/lib/logger';
import { redirectWithError, redirectWithInfo } from '~/lib/flash-message.server';
import { accessTokenCookie, refreshTokenCookie } from '~/routes/auth/_features/auth.cookies.server';
import { getBookingRouteMap } from '../../../_utils/booking.route-map';
import type { BookingSurface } from '../../../_utils/booking.surface';
import { ContactAuthService } from '../_services/contact-auth.service.server';

type CreateBookingContactSignInActionOptions = {
  surface: BookingSurface;
};

function buildSignInRetryHref(request: Request, email: string, provider: string): string {
  const currentUrl = new URL(request.url);
  const retryUrl = new URL(`${currentUrl.pathname}${currentUrl.search}`, currentUrl.origin);

  if (email) {
    retryUrl.searchParams.set('email', email);
  } else {
    retryUrl.searchParams.delete('email');
  }

  if (provider === 'GOOGLE') {
    retryUrl.searchParams.set('provider', provider);
  } else {
    retryUrl.searchParams.delete('provider');
  }

  return `${retryUrl.pathname}${retryUrl.search}`;
}

export function createBookingContactSignInAction({ surface }: CreateBookingContactSignInActionOptions) {
  return async function bookingContactSignInAction({ request }: ActionFunctionArgs) {
    const routes = getBookingRouteMap(surface);
    logger.info('[sign-in] Action called', { request });

    const formData = await request.formData();
    const provider = String(formData.get('provider') || 'LOCAL');
    const idToken = String(formData.get('idToken') || '');
    const email = String(formData.get('email') || '');
    const password = String(formData.get('password') || '');
    const redirectUrl = String(formData.get('redirectUrl') || '');
    const isGoogleLogin = provider === 'GOOGLE';
    const retryHref = buildSignInRetryHref(request, email, provider);

    if (isGoogleLogin && !idToken) {
      return redirectWithError(request, retryHref, 'Kunne ikke logge inn med Google. Prøv igjen.');
    }

    try {
      const response = isGoogleLogin
        ? await ContactAuthService.signInWithProvider({
            provider: 'GOOGLE',
            idToken,
            redirectUrl,
          })
        : await ContactAuthService.signInLocal({
            emailOrMobile: email,
            password,
            redirectUrl,
          });

      if (response?.userId) {
        await ContactAuthService.attachUserToSession(request, response.userId);
      }

      const headers = new Headers();
      if (response?.authTokens) {
        headers.append('Set-Cookie', response.authTokens.accessToken);
        headers.append('Set-Cookie', response.authTokens.refreshToken);
        headers.append(
          'Set-Cookie',
          await accessTokenCookie.serialize(response.authTokens.accessToken, {
            expires: new Date(response.authTokens.accessTokenExpiresAt * 1000),
          }),
        );
        headers.append(
          'Set-Cookie',
          await refreshTokenCookie.serialize(response.authTokens.refreshToken, {
            expires: new Date(response.authTokens.refreshTokenExpiresAt * 1000),
          }),
        );
      }

      const { nextStepHref, verificationCookieHeader } = await ContactAuthService.resolvePostAuthRedirect(response, {
        surface,
      });
      if (verificationCookieHeader) {
        headers.append('Set-Cookie', verificationCookieHeader);
      }

      if (nextStepHref) {
        return redirect(nextStepHref, { headers });
      }

      return redirectWithInfo(request, routes.contact, 'Kunne ikke logge inn. Prøv igjen.');
    } catch (error) {
      const { message, status } = resolveErrorPayload(error, 'Kunne ikke logge inn. Prøv igjen.');
      logger.warn('[sign-in] Login failed', { status: status ?? 400, message });
      return redirectWithError(request, retryHref, message);
    }
  };
}
