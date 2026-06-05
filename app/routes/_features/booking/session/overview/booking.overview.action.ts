import { redirect, type ActionFunctionArgs } from 'react-router';
import { PublicAppointmentSessionController } from '~/api/generated/booking';
import { resolveErrorPayload } from '~/lib/api-error';
import { redirectWithError } from '~/lib/flash-message.server';
import { requireAuthenticatedBookingFlow } from '../../_utils/booking.require-authenticated-flow.server';
import { getBookingRouteMap } from '../../_utils/booking.route-map';
import type { BookingSurface } from '../../_utils/booking.surface';

type CreateBookingOverviewActionOptions = {
  surface: BookingSurface;
};

export function createBookingOverviewAction({ surface }: CreateBookingOverviewActionOptions) {
  return async function bookingOverviewAction({ request }: ActionFunctionArgs) {
    const routes = getBookingRouteMap(surface);

    try {
      const guardResult = await requireAuthenticatedBookingFlow(request, surface);
      if (guardResult instanceof Response) {
        return guardResult;
      }

      const { session } = guardResult;
      const submitResponse = await PublicAppointmentSessionController.submitAppointmentSession({
        query: {
          sessionId: session.sessionId,
        },
      });

      const appointmentId = submitResponse.data?.data?.id;
      if (!appointmentId) {
        return redirectWithError(request, routes.overview, 'Kunne ikke bekrefte timebestilling');
      }

      return redirect(`${routes.success}?companyId=${session.companyId}&appointmentId=${appointmentId}`);
    } catch (error) {
      const { message } = resolveErrorPayload(error, 'Kunne ikke bekrefte timebestilling');
      return redirectWithError(request, routes.appointment, message);
    }
  };
}
