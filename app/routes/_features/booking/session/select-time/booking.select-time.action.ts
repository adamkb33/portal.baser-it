import { redirect, type ActionFunctionArgs } from 'react-router';
import { PublicAppointmentSessionController } from '~/api/generated/booking';
import { resolveErrorPayload } from '~/lib/api-error';
import { requireAuthenticatedBookingFlow } from '~/routes/_features/booking/_utils/booking.require-authenticated-flow.server';
import { redirectWithError } from '~/lib/flash-message.server';
import { getBookingRouteMap } from '../../_utils/booking.route-map';
import type { BookingSurface } from '../../_utils/booking.surface';

type CreateBookingSelectTimeActionOptions = {
  surface: BookingSurface;
};

export function createBookingSelectTimeAction({ surface }: CreateBookingSelectTimeActionOptions) {
  return async function bookingSelectTimeAction({ request }: ActionFunctionArgs) {
    const routes = getBookingRouteMap(surface);
    const guardResult = await requireAuthenticatedBookingFlow(request, surface);
    if (guardResult instanceof Response) {
      return guardResult;
    }
    const { session } = guardResult;

    const formData = await request.formData();
    const selectedStartTime = formData.get('selectedStartTime') as string;

    try {
      await PublicAppointmentSessionController.submitAppointmentSessionStartTime({
        query: {
          sessionId: session.sessionId,
          selectedStartTime,
        },
      });

      return redirect(routes.overview);
    } catch (error) {
      const { message } = resolveErrorPayload(error, 'Kunne ikke lagre tidspunkt');
      return redirectWithError(request, routes.selectTime, message);
    }
  };
}
