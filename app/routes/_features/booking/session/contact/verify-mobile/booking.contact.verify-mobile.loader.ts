import { data, redirect, type LoaderFunctionArgs } from 'react-router';
import { resolveErrorPayload } from '~/lib/api-error';
import { redirectWithError } from '~/lib/flash-message.server';
import { AppointmentSessionService } from '../../../_services/booking.appointment-session.service.server';
import { getBookingRouteMap } from '../../../_utils/booking.route-map';
import type { BookingSurface } from '../../../_utils/booking.surface';
import { ContactAuthService } from '../_services/contact-auth.service.server';
import { VerificationTokenService } from '../_services/verification-token.service.server';
import { redirectAuthStatusNextStepHref } from '../_utils/auth.utils';

type CreateBookingContactVerifyMobileLoaderOptions = {
  surface: BookingSurface;
};

export function createBookingContactVerifyMobileLoader({ surface }: CreateBookingContactVerifyMobileLoaderOptions) {
  return async function bookingContactVerifyMobileLoader({ request }: LoaderFunctionArgs) {
    const routes = getBookingRouteMap(surface);

    try {
      const session = await AppointmentSessionService.get(request);

      if (!session || !session.userId) {
        console.info('[verify-mobile] redirect: missing session or userId', {
          hasSession: Boolean(session),
          userId: session?.userId ?? null,
        });
        return redirect(routes.session);
      }

      const authStatus = await ContactAuthService.getUserStatus(request);
      if (!authStatus) {
        console.info('[verify-mobile] redirect: missing auth status data', {
          userId: session.userId,
        });
        return redirect(routes.session);
      }

      const verificationSessionToken = await VerificationTokenService.readVerificationToken(request);
      if (!verificationSessionToken) {
        console.info('[verify-mobile] redirect: missing verification token cookie', {
          userId: session.userId,
        });
        return redirect(routes.contact);
      }

      if (authStatus.nextStep !== 'VERIFY_MOBILE') {
        console.info('[verify-mobile] redirect: nextStep is not VERIFY_MOBILE', {
          userId: session.userId,
          nextStep: authStatus.nextStep,
        });
        return redirectAuthStatusNextStepHref(authStatus, surface);
      }

      return data({
        session,
        authStatus,
        verificationSessionToken,
        surface,
        navigation: {
          previousStep: routes.contactCollectMobile,
        },
      });
    } catch (error) {
      const { message } = resolveErrorPayload(error, 'Kunne ikke hente brukerdata');
      console.error('[verify-mobile] redirect: loader error', { message });
      return redirectWithError(request, routes.session, message);
    }
  };
}
