import { redirect, type ActionFunctionArgs } from 'react-router';
import { resolveErrorPayload } from '~/lib/api-error';
import { redirectWithError, redirectWithInfo } from '~/lib/flash-message.server';
import { accessTokenCookie, refreshTokenCookie } from '~/routes/auth/_features/auth.cookies.server';
import { AppointmentSessionService } from '../../../_services/booking.appointment-session.service.server';
import { getBookingRouteMap } from '../../../_utils/booking.route-map';
import type { BookingSurface } from '../../../_utils/booking.surface';
import { ContactAuthService } from '../_services/contact-auth.service.server';
import { resolveAuthNextStepHref } from '../_utils/auth.utils';

type CreateBookingContactSignUpActionOptions = {
  surface: BookingSurface;
};

function buildSignUpRetryHref(request: Request, fields: Record<string, string>): string {
  const currentUrl = new URL(request.url);
  const retryUrl = new URL(`${currentUrl.pathname}${currentUrl.search}`, currentUrl.origin);

  for (const [key, value] of Object.entries(fields)) {
    if (value) {
      retryUrl.searchParams.set(key, value);
    } else {
      retryUrl.searchParams.delete(key);
    }
  }

  return `${retryUrl.pathname}${retryUrl.search}`;
}

export function createBookingContactSignUpAction({ surface }: CreateBookingContactSignUpActionOptions) {
  return async function bookingContactSignUpAction({ request }: ActionFunctionArgs) {
    const routes = getBookingRouteMap(surface);
    const formData = await request.formData();
    const givenName = String(formData.get('givenName') || '');
    const familyName = String(formData.get('familyName') || '');
    const email = String(formData.get('email') || '');
    const password = String(formData.get('password') || '');
    const password2 = String(formData.get('password2') || '');
    const mobileNumber = String(formData.get('mobileNumber') || '');
    const redirectUrl = String(formData.get('redirectUrl') || '');
    const retryHref = buildSignUpRetryHref(request, { givenName, familyName, email, mobileNumber });

    try {
      const response = await ContactAuthService.signUp({
        givenName,
        familyName,
        email,
        password,
        password2,
        mobileNumber,
        redirectUrl,
      });

      const session = await AppointmentSessionService.get(request);
      if (!session) {
        return redirectWithError(request, routes.session, '[sign-up] Kunne ikke hente session');
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

      if (!response) {
        return redirectWithError(request, retryHref, 'Kunne ikke opprette konto. Prøv igjen.');
      }

      const setPendingUserResponse = await ContactAuthService.setPendingSessionUser(session.sessionId, response.userId);

      if (!setPendingUserResponse) {
        return redirectWithError(request, retryHref, 'Kunne ikke knytte brukeren til økten. Prøv igjen.');
      }
      const { verificationCookieHeader } = await ContactAuthService.resolvePostAuthRedirect(response, { surface });
      if (verificationCookieHeader) {
        headers.append('Set-Cookie', verificationCookieHeader);
      }

      const nextStepHref = resolveAuthNextStepHref(response.nextStep, surface);
      if (nextStepHref) {
        return redirect(nextStepHref, { headers });
      }

      return redirectWithInfo(request, routes.contact, 'Kunne ikke opprette konto. Prøv igjen.', headers);
    } catch (error) {
      const { message } = resolveErrorPayload(error, 'Kunne ikke opprette konto. Prøv igjen.');
      return redirectWithError(request, retryHref, message);
    }
  };
}
