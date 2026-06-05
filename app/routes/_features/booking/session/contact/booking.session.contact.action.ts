import { redirect, type ActionFunctionArgs } from 'react-router';
import { authService } from '~/lib/auth-service';
import { redirectWithError, redirectWithInfo } from '~/lib/flash-message.server';
import { getBookingRouteMap } from '../../_utils/booking.route-map';
import type { BookingSurface } from '../../_utils/booking.surface';
import { AppointmentSessionService } from '../../_services/booking.appointment-session.service.server';
import { logger } from '~/lib/logger';
import { ContactSessionService } from './_services/contact-session.service.server';
import { resolveAuthNextStepHref } from './_utils/auth.utils';
import { ContactAuthService } from './_services/contact-auth.service.server';
import { accessTokenCookie, refreshTokenCookie } from '~/routes/auth/_features/auth.cookies.server';
import { resolveErrorPayload } from '~/lib/api-error';

const ACTION_INTENT = {
  CONTINUE_WITH_SESSION_USER: 'continue-with-session-user',
  CONTINUE_WITH_PROVIDER: 'continue-with-provider',
  CONTINUE_WITH_AUTHENTICATED_USER: 'continue-with-authenticated-user',
} as const;

type CreateBookingSessionContactActionOptions = {
  surface: BookingSurface;
};

export function createBookingSessionContactAction({ surface }: CreateBookingSessionContactActionOptions) {
  return async function bookingSessionContactAction({ request }: ActionFunctionArgs) {
    const routes = getBookingRouteMap(surface);
    const formData = await request.formData();
    const intent = formData.get('intent');

    try {
      if (intent === ACTION_INTENT.CONTINUE_WITH_AUTHENTICATED_USER) {
        const auth = await authService.getAuth(request);
        if (!auth) {
          return redirectWithError(request, routes.contact, 'Kunne ikke hente autentisering');
        }

        await AppointmentSessionService.attachUser(request, auth.id);

        return redirect(routes.employee);
      }

      if (intent === ACTION_INTENT.CONTINUE_WITH_SESSION_USER) {
        const session = await AppointmentSessionService.get(request);
        logger.info('[booking.public.appointment.session.contact] CONTINUE_WITH_SESSION_USER', { session });
        if (!session) {
          logger.error('[booking.public.appointment.session.contact] CONTINUE_WITH_SESSION_USER no session');
          return redirectWithError(request, routes.contact, 'Kunne ikke hente session, prøv å start på nytt');
        }

        if (!session.userId) {
          logger.error('[booking.public.appointment.session.contact] CONTINUE_WITH_SESSION_USER no userId');
          return redirectWithError(request, routes.contact, 'Kunne ikke hente bruker-ID');
        }

        const sessionUser = await ContactSessionService.getSessionUserStatus(request);
        if (!sessionUser) {
          logger.error('[booking.public.appointment.session.contact] CONTINUE_WITH_SESSION_USER no sessionUser');
          return redirectWithError(request, routes.contact, 'Kunne ikke hente session-bruker');
        }

        const auth = await authService.getAuth(request);
        if (!auth) {
          logger.error('[booking.public.appointment.session.contact] CONTINUE_WITH_SESSION_USER no auth');
          const params = new URLSearchParams();
          if (sessionUser.user.email) {
            params.set('email', sessionUser.user.email);
          }
          if (sessionUser.user.provider) {
            params.set('provider', sessionUser.user.provider);
          }
          return redirect(params.toString() ? `${routes.contactSignIn}?${params.toString()}` : routes.contactSignIn);
        }

        const profileStatus = await ContactSessionService.getSessionUserStatus(request);

        if (!profileStatus) {
          logger.error('[booking.public.appointment.session.contact] CONTINUE_WITH_SESSION_USER no profileStatus');
          return redirectWithError(request, routes.contact, 'Kunne ikke hente brukerstatus');
        }

        const nextStepHref = resolveAuthNextStepHref(profileStatus.nextStep, surface);
        if (nextStepHref) {
          logger.info('[booking.public.appointment.session.contact] CONTINUE_WITH_SESSION_USER', { nextStepHref });
          return redirect(nextStepHref);
        }

        return redirect(routes.employee);
      }

      if (intent === ACTION_INTENT.CONTINUE_WITH_PROVIDER) {
        const provider = String(formData.get('provider') || 'LOCAL');
        const idToken = String(formData.get('idToken') || '');
        const redirectUrl = String(formData.get('redirectUrl') || '');
        const isGoogleLogin = provider === 'GOOGLE';

        if (!isGoogleLogin) {
          return redirectWithError(request, routes.contact, 'Ugyldig innloggingsleverandør.');
        }

        if (isGoogleLogin && !idToken) {
          return redirectWithError(request, routes.contact, 'Kunne ikke logge inn med Google. Prøv igjen.');
        }

        const response = await ContactAuthService.signInWithProvider({
          provider: 'GOOGLE',
          idToken,
          redirectUrl,
        });

        if (response?.userId) {
          await ContactAuthService.attachUserToSession(request, response.userId);
        }
        let headers = new Headers();

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
      }

      return redirectWithError(request, routes.contact, 'Ugyldig handling.');
    } catch (error) {
      const { message } = resolveErrorPayload(error, 'Kunne ikke fortsette. Prøv igjen.');
      return redirectWithError(request, routes.contact, message);
    }
  };
}
