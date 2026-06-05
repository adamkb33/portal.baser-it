import { redirect, type ActionFunctionArgs } from 'react-router';
import { PublicAppointmentSessionController } from '~/api/generated/booking';
import { resolveErrorPayload } from '~/lib/api-error';
import { redirectWithError } from '~/lib/flash-message.server';
import { requireAuthenticatedBookingFlow } from '../../_utils/booking.require-authenticated-flow.server';
import { getBookingRouteMap } from '../../_utils/booking.route-map';
import type { BookingSurface } from '../../_utils/booking.surface';

type CreateBookingSelectServicesActionOptions = {
  surface: BookingSurface;
};

export function createBookingSelectServicesAction({ surface }: CreateBookingSelectServicesActionOptions) {
  return async function bookingSelectServicesAction({ request }: ActionFunctionArgs) {
    const routes = getBookingRouteMap(surface);

    try {
      const guardResult = await requireAuthenticatedBookingFlow(request, surface);
      if (guardResult instanceof Response) {
        return guardResult;
      }

      const { session } = guardResult;
      const formData = await request.formData();
      const selectedServices = Array.from(formData.entries())
        .filter(([key]) => key.startsWith('serviceQuantity:'))
        .map(([key, value]) => {
          const serviceId = Number(key.replace('serviceQuantity:', ''));
          const quantity = Number(value);
          return { serviceId, quantity };
        })
        .filter(
          (item) =>
            Number.isInteger(item.serviceId) &&
            item.serviceId > 0 &&
            Number.isInteger(item.quantity) &&
            item.quantity > 0,
        );

      await PublicAppointmentSessionController.selectAppointmentSessionProfileServices({
        body: {
          selectedServices,
        },
        query: {
          sessionId: session.sessionId,
        },
      });

      return redirect(routes.selectTime);
    } catch (error) {
      const { message } = resolveErrorPayload(error, 'Kunne ikke lagre tjenestevalg');
      return redirectWithError(request, routes.selectServices, message);
    }
  };
}
