import { data, type LoaderFunctionArgs } from 'react-router';
import { PublicAppointmentSessionController } from '~/api/generated/booking';
import { resolveErrorPayload } from '~/lib/api-error';
import { redirectWithError } from '~/lib/flash-message.server';
import { requireAuthenticatedBookingFlow } from '../../_utils/booking.require-authenticated-flow.server';
import { getBookingRouteMap } from '../../_utils/booking.route-map';
import type { BookingSurface } from '../../_utils/booking.surface';

type CreateBookingSelectServicesLoaderOptions = {
  surface: BookingSurface;
};

export function createBookingSelectServicesLoader({ surface }: CreateBookingSelectServicesLoaderOptions) {
  return async function bookingSelectServicesLoader({ request }: LoaderFunctionArgs) {
    const routes = getBookingRouteMap(surface);

    try {
      const guardResult = await requireAuthenticatedBookingFlow(request, surface);
      if (guardResult instanceof Response) {
        return guardResult;
      }

      const { session } = guardResult;
      const serviceGroupsResponse = await PublicAppointmentSessionController.getAppointmentSessionProfileServices({
        query: {
          sessionId: session.sessionId,
        },
      });

      return data({
        session,
        serviceGroups: serviceGroupsResponse.data?.data || [],
        navigation: {
          employee: routes.employee,
        },
      });
    } catch (error) {
      const { message } = resolveErrorPayload(error, 'Kunne ikke hente tjenester');
      return redirectWithError(request, routes.employee, message);
    }
  };
}
