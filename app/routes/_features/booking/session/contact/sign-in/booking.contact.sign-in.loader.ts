import { data, type LoaderFunctionArgs } from 'react-router';
import { redirectWithError } from '~/lib/flash-message.server';
import { AppointmentSessionService } from '../../../_services/booking.appointment-session.service.server';
import { getBookingRouteMap } from '../../../_utils/booking.route-map';
import type { BookingSurface } from '../../../_utils/booking.surface';

type CreateBookingContactSignInLoaderOptions = {
  surface: BookingSurface;
};

export function createBookingContactSignInLoader({ surface }: CreateBookingContactSignInLoaderOptions) {
  return async function bookingContactSignInLoader({ request }: LoaderFunctionArgs) {
    const routes = getBookingRouteMap(surface);
    const session = await AppointmentSessionService.get(request);

    if (!session) {
      return redirectWithError(request, routes.session, 'Kunne ikke hente session');
    }

    const url = new URL(request.url);
    const email = url.searchParams.get('email') || '';

    return data({ session, email, contactHref: routes.contact });
  };
}
