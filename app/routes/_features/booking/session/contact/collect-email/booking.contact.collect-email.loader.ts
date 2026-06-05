import { data, type LoaderFunctionArgs } from 'react-router';
import { redirectWithError } from '~/lib/flash-message.server';
import { AppointmentSessionService } from '../../../_services/booking.appointment-session.service.server';
import { getBookingRouteMap } from '../../../_utils/booking.route-map';
import type { BookingSurface } from '../../../_utils/booking.surface';

type CreateBookingContactCollectEmailLoaderOptions = {
  surface: BookingSurface;
};

export function createBookingContactCollectEmailLoader({ surface }: CreateBookingContactCollectEmailLoaderOptions) {
  return async function bookingContactCollectEmailLoader({ request }: LoaderFunctionArgs) {
    const routes = getBookingRouteMap(surface);
    const session = await AppointmentSessionService.get(request);

    if (!session) {
      return redirectWithError(request, routes.appointment, 'Kunne ikke hente session');
    }

    const url = new URL(request.url);
    return data({ session, email: url.searchParams.get('email') || '' });
  };
}
