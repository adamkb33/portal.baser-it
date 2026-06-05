import { data, type LoaderFunctionArgs } from 'react-router';
import { PublicAppointmentSessionController } from '~/api/generated/booking';
import { resolveErrorPayload } from '~/lib/api-error';
import { redirectWithError } from '~/lib/flash-message.server';
import { requireAuthenticatedBookingFlow } from '../../_utils/booking.require-authenticated-flow.server';
import { getBookingRouteMap } from '../../_utils/booking.route-map';
import type { BookingSurface } from '../../_utils/booking.surface';

type CreateBookingEmployeeLoaderOptions = {
  surface: BookingSurface;
};

export function createBookingEmployeeLoader({ surface }: CreateBookingEmployeeLoaderOptions) {
  return async function bookingEmployeeLoader({ request }: LoaderFunctionArgs) {
    const routes = getBookingRouteMap(surface);

    try {
      const guardResult = await requireAuthenticatedBookingFlow(request, surface);
      if (guardResult instanceof Response) {
        return guardResult;
      }

      const { session } = guardResult;
      const profilesResponse = await PublicAppointmentSessionController.getAppointmentSessionProfiles({
        query: {
          sessionId: session.sessionId,
        },
      });

      return data({
        session,
        profiles: profilesResponse.data?.data || [],
        selectedProfileId: session.selectedProfileId,
        navigation: {
          contact: routes.contact,
          selectServices: routes.selectServices,
        },
      });
    } catch (error) {
      const { message } = resolveErrorPayload(error, 'Kunne ikke hente frisører');
      return redirectWithError(request, routes.contact, message);
    }
  };
}
