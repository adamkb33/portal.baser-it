import { data, type LoaderFunctionArgs } from 'react-router';
import { PublicAppointmentSessionController } from '~/api/generated/booking';
import { resolveErrorPayload } from '~/lib/api-error';
import { requireAuthenticatedBookingFlow } from '~/routes/_features/booking/_utils/booking.require-authenticated-flow.server';
import { redirectWithError } from '~/lib/flash-message.server';
import { getBookingRouteMap } from '../../_utils/booking.route-map';
import type { BookingSurface } from '../../_utils/booking.surface';

type CreateBookingSelectTimeLoaderOptions = {
  surface: BookingSurface;
};

export function createBookingSelectTimeLoader({ surface }: CreateBookingSelectTimeLoaderOptions) {
  return async function bookingSelectTimeLoader({ request }: LoaderFunctionArgs) {
    const routes = getBookingRouteMap(surface);
    const guardResult = await requireAuthenticatedBookingFlow(request, surface);
    if (guardResult instanceof Response) {
      return guardResult;
    }
    const { session } = guardResult;

    try {
      const schedulesResponse = await PublicAppointmentSessionController.getAppointmentSessionSchedules({
        query: {
          sessionId: session.sessionId,
        },
      });

      return data({
        session,
        schedules: schedulesResponse.data?.data || [],
        navigation: {
          overview: routes.overview,
          selectServices: routes.selectServices,
        },
      });
    } catch (error) {
      const { message } = resolveErrorPayload(error, 'Kunne ikke hente tilgjengelige tider');
      return redirectWithError(request, routes.selectServices, message);
    }
  };
}
