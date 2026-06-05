import { data, type LoaderFunctionArgs } from 'react-router';
import { ContactSessionService } from './_services/contact-session.service.server';
import { redirectWithError } from '~/lib/flash-message.server';
import { resolveErrorPayload } from '~/lib/api-error';
import { getBookingRouteMap } from '../../_utils/booking.route-map';
import type { BookingSurface } from '../../_utils/booking.surface';

type CreateBookingSessionContactLayoutLoaderOptions = {
  surface: BookingSurface;
};

export function createBookingSessionContactLayoutLoader({ surface }: CreateBookingSessionContactLayoutLoaderOptions) {
  return async function bookingSessionContactLayoutLoader({ request }: LoaderFunctionArgs) {
    const routes = getBookingRouteMap(surface);

    try {
      const { session, sessionUser, auth, verificationSessionToken } =
        await ContactSessionService.getContactContext(request);

      if (!session) {
        return redirectWithError(request, routes.session, 'Kunne ikke hente session');
      }

      return data({
        session,
        sessionUser,
        auth,
        verificationSessionToken,
      });
    } catch (error) {
      const { message } = resolveErrorPayload(error, 'Kunne ikke hente session');
      console.error('[contact.layout] Loader failed', { message, error });
      return redirectWithError(request, routes.session, message);
    }
  };
}
