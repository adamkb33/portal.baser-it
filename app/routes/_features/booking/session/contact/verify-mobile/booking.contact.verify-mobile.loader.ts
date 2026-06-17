import { data, redirect, type LoaderFunctionArgs } from 'react-router';
import { resolveErrorPayload } from '~/lib/api-error';
import { redirectWithError } from '~/lib/flash-message.server';
import { AppointmentSessionService } from '../../../_services/booking.appointment-session.service.server';
import { getBookingRouteMap } from '../../../_utils/booking.route-map';
import type { BookingSurface } from '../../../_utils/booking.surface';
import { VerificationTokenService } from '../_services/verification-token.service.server';

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

      const verificationSessionToken = await VerificationTokenService.readVerificationToken(request);
      if (!verificationSessionToken) {
        console.info('[verify-mobile] redirect: missing verification token cookie', {
          userId: session.userId,
        });
        return redirect(routes.contact);
      }

      return data({
        session,
        verificationSessionToken,
        surface,
        navigation: {
          currentStep: routes.contactVerifyMobile,
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
