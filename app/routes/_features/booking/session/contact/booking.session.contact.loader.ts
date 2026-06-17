import { data, type LoaderFunctionArgs } from 'react-router';
import { ContactSessionService } from './_services/contact-session.service.server';
import { redirectWithError } from '~/lib/flash-message.server';
import { getBookingRouteMap } from '../../_utils/booking.route-map';
import type { BookingSurface } from '../../_utils/booking.surface';
import { resolveErrorPayload } from '~/lib/api-error';
import { AppointmentSessionService } from '../../_services/booking.appointment-session.service.server';

type CreateBookingSessionContactLoaderOptions = {
  surface: BookingSurface;
};

export function createBookingSessionContactLoader({ surface }: CreateBookingSessionContactLoaderOptions) {
  return async function bookingSessionContactLoader({ request }: LoaderFunctionArgs) {
    const routes = getBookingRouteMap(surface);

    try {
      const { session, sessionStatus, sessionUser, auth, verificationSessionToken } =
        await ContactSessionService.getContactContext(request);

      if (!session) {
        if (sessionStatus === 'stale-cookie') {
          const clearSessionCookie = await AppointmentSessionService.delete(request);
          return redirectWithError(request, routes.appointment, 'Bookingøkten er utløpt. Start på nytt.', {
            'Set-Cookie': clearSessionCookie,
          });
        }

        return redirectWithError(request, routes.session, 'Kunne ikke hente session');
      }

      return data({
        session,
        sessionUser,
        auth,
        verificationSessionToken,
        navigation: {
          myAppointments: routes.myAppointments,
        },
      });
    } catch (error) {
      const { message } = resolveErrorPayload(error, 'Kunne ikke hente session');
      return redirectWithError(request, routes.session, message);
    }
  };
}
