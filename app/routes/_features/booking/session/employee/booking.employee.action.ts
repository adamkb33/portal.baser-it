import { redirect, type ActionFunctionArgs } from 'react-router';
import { PublicAppointmentSessionController } from '~/api/generated/booking';
import { resolveErrorPayload } from '~/lib/api-error';
import { redirectWithError } from '~/lib/flash-message.server';
import { requireAuthenticatedBookingFlow } from '../../_utils/booking.require-authenticated-flow.server';
import { getBookingRouteMap } from '../../_utils/booking.route-map';
import type { BookingSurface } from '../../_utils/booking.surface';

type CreateBookingEmployeeActionOptions = {
  surface: BookingSurface;
};

export function createBookingEmployeeAction({ surface }: CreateBookingEmployeeActionOptions) {
  return async function bookingEmployeeAction({ request }: ActionFunctionArgs) {
    const routes = getBookingRouteMap(surface);

    try {
      const guardResult = await requireAuthenticatedBookingFlow(request, surface);
      if (guardResult instanceof Response) {
        return guardResult;
      }

      const { session } = guardResult;
      const formData = await request.formData();
      const selectedProfileId = formData.get('selectedProfileId') as string;

      await PublicAppointmentSessionController.selectAppointmentSessionProfile({
        query: {
          sessionId: session.sessionId,
          selectedProfileId: Number(selectedProfileId),
        },
      });

      return redirect(routes.selectServices);
    } catch (error) {
      const { message } = resolveErrorPayload(error, 'Kunne ikke velge frisør');
      return redirectWithError(request, routes.employee, message);
    }
  };
}
