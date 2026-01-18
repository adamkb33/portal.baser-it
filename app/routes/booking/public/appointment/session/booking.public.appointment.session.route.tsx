import { redirect } from 'react-router';
import type { ApiClientError } from '~/api/clients/http';
import { AppointmentsController } from '~/api/generated/booking';
import { createAppointmentSession, getSession } from '~/lib/appointments.server';
import { ROUTES_MAP } from '~/lib/route-tree';
import type { Route } from './+types/booking.public.appointment.session.route';

export async function loader({ request }: Route.LoaderArgs) {
  try {
    const url = new URL(request.url);
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
      const session = await getSession(request);

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
    console.error(JSON.stringify(error, null, 2));

    if (error as ApiClientError) {
      return redirect('/', { status: 302 });
    }

    throw error;
  }
}

export default function BookingPublicAppointmentSessionRoute() {
  return <div>BookingPublicAppointmentSessionRoute</div>;
}
