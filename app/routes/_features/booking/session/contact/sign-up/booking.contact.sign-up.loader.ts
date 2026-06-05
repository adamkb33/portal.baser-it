import { data, type LoaderFunctionArgs } from 'react-router';
import { redirectWithError } from '~/lib/flash-message.server';
import { AppointmentSessionService } from '../../../_services/booking.appointment-session.service.server';
import { getBookingRouteMap } from '../../../_utils/booking.route-map';
import type { BookingSurface } from '../../../_utils/booking.surface';

type CreateBookingContactSignUpLoaderOptions = {
  surface: BookingSurface;
};

export function createBookingContactSignUpLoader({ surface }: CreateBookingContactSignUpLoaderOptions) {
  return async function bookingContactSignUpLoader({ request }: LoaderFunctionArgs) {
    const routes = getBookingRouteMap(surface);
    const session = await AppointmentSessionService.get(request);

    if (!session) {
      return redirectWithError(request, routes.session, 'Kunne ikke hente session');
    }

    const url = new URL(request.url);
    return data({
      session,
      contactHref: routes.contact,
      defaults: {
        givenName: url.searchParams.get('givenName') || '',
        familyName: url.searchParams.get('familyName') || '',
        email: url.searchParams.get('email') || '',
        mobileNumber: url.searchParams.get('mobileNumber') || '',
      },
    });
  };
}
