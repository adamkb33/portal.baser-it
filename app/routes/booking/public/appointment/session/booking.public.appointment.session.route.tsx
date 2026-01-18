import { redirect } from 'react-router';
import { AppointmentsController } from '~/api/generated/booking';
import { createAppointmentSession, getSession } from '~/lib/appointments.server';
import { ROUTES_MAP } from '~/lib/route-tree';
import type { Route } from './+types/booking.public.appointment.session.route';
import { handleRouteError } from '~/lib/api-error';

export async function loader(args: Route.LoaderArgs) {
  try {
    const url = new URL(args.request.url);
    const companyId = url.searchParams.get('companyId');

    if (companyId) {
      await AppointmentsController.validateCompanyBooking({
        path: {
          companyId: Number(companyId),
        }
      });

      const session = await createAppointmentSession(Number(companyId));

      return redirect(ROUTES_MAP['booking.public.appointment.session.contact'].href, {
        headers: {
          'Set-Cookie': session.setCookieHeader,
        },
      });
    } else {
      const session = await getSession(args.request);

      if (session) {
        await AppointmentsController.validateCompanyBooking({
          path: {
            companyId: session.companyId,
          },
        });

        return redirect(ROUTES_MAP['booking.public.appointment.session.contact'].href);
      }

      return redirect(ROUTES_MAP['booking.public.appointment'].href);
    }
  } catch (error: any) {
    return handleRouteError(error, args, { fallbackMessage: 'Kunne ikke starte booking' });
  }
}

export default function BookingPublicAppointmentSessionRoute() {
  return <div>BookingPublicAppointmentSessionRoute</div>;
}
