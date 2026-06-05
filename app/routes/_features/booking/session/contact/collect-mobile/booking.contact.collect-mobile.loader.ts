import { data, type LoaderFunctionArgs } from 'react-router';
import { redirectWithError } from '~/lib/flash-message.server';
import { AppointmentSessionService } from '../../../_services/booking.appointment-session.service.server';
import { getBookingRouteMap } from '../../../_utils/booking.route-map';
import type { BookingSurface } from '../../../_utils/booking.surface';

type CreateBookingContactCollectMobileLoaderOptions = {
  surface: BookingSurface;
};

export function createBookingContactCollectMobileLoader({ surface }: CreateBookingContactCollectMobileLoaderOptions) {
  return async function bookingContactCollectMobileLoader({ request }: LoaderFunctionArgs) {
    const routes = getBookingRouteMap(surface);
    const session = await AppointmentSessionService.get(request);

    if (!session) {
      return redirectWithError(request, routes.appointment, 'Kunne ikke hente session');
    }

    const url = new URL(request.url);
    return data({ session, mobileNumber: url.searchParams.get('mobileNumber') || '' });
  };
}
