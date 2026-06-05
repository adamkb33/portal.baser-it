import { type LoaderFunctionArgs } from 'react-router';
import { PublicAppointmentSessionController } from '~/api/generated/booking';
import { resolveErrorPayload } from '~/lib/api-error';
import { redirectWithError } from '~/lib/flash-message.server';
import { requireAuthenticatedBookingFlow } from '../../_utils/booking.require-authenticated-flow.server';
import { getBookingRouteMap } from '../../_utils/booking.route-map';
import type { BookingSurface } from '../../_utils/booking.surface';

type CreateBookingOverviewLoaderOptions = {
  surface: BookingSurface;
};

export function createBookingOverviewLoader({ surface }: CreateBookingOverviewLoaderOptions) {
  return async function bookingOverviewLoader({ request }: LoaderFunctionArgs) {
    const routes = getBookingRouteMap(surface);

    try {
      const guardResult = await requireAuthenticatedBookingFlow(request, surface);
      if (guardResult instanceof Response) {
        return guardResult;
      }

      const { session } = guardResult;
      const response = await PublicAppointmentSessionController.getAppointmentSessionOverview({
        query: {
          sessionId: session.sessionId,
        },
      });

      if (!response.data?.data) {
        const message = response.data?.message || 'Kunne ikke hente oversikt';
        return redirectWithError(request, routes.selectTime, message);
      }

      return {
        sessionOverview: response.data.data,
        navigation: {
          contact: routes.contact,
          employee: routes.employee,
          selectServices: routes.selectServices,
          selectTime: routes.selectTime,
        },
      };
    } catch (error) {
      const { message } = resolveErrorPayload(error, 'Kunne ikke hente oversikt');
      return redirectWithError(request, routes.appointment, message);
    }
  };
}
