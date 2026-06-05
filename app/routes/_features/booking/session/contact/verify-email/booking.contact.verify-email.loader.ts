import { data, redirect, type LoaderFunctionArgs } from 'react-router';
import { resolveErrorPayload } from '~/lib/api-error';
import { redirectWithError } from '~/lib/flash-message.server';
import { AppointmentSessionService } from '../../../_services/booking.appointment-session.service.server';
import { getBookingRouteMap } from '../../../_utils/booking.route-map';
import type { BookingSurface } from '../../../_utils/booking.surface';
import { ContactAuthService } from '../_services/contact-auth.service.server';
import { VerificationTokenService } from '../_services/verification-token.service.server';
import { redirectAuthStatusNextStepHref } from '../_utils/auth.utils';

type CreateBookingContactVerifyEmailLoaderOptions = {
  surface: BookingSurface;
};

export function createBookingContactVerifyEmailLoader({ surface }: CreateBookingContactVerifyEmailLoaderOptions) {
  return async function bookingContactVerifyEmailLoader({ request }: LoaderFunctionArgs) {
    const routes = getBookingRouteMap(surface);

    try {
      const session = await AppointmentSessionService.get(request);

      if (!session || !session.userId) {
        return redirect(routes.session);
      }

      const authStatus = await ContactAuthService.getUserStatus(request);
      if (!authStatus) {
        return redirect(routes.session);
      }

      const verificationSessionToken = await VerificationTokenService.readVerificationToken(request);
      if (!verificationSessionToken) {
        return redirect(routes.contact);
      }

      if (authStatus.nextStep !== 'VERIFY_EMAIL') {
        return redirectAuthStatusNextStepHref(authStatus, surface);
      }

      return data({
        session,
        authStatus,
        verificationSessionToken,
        surface,
        navigation: {
          previousStep: routes.contactCollectEmail,
        },
      });
    } catch (error) {
      const { message } = resolveErrorPayload(error, 'Kunne ikke hente brukerdata');
      return redirectWithError(request, routes.session, message);
    }
  };
}
