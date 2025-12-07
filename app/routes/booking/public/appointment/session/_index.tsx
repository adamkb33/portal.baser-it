import { data, redirect } from 'react-router';
import type { LoaderFunctionArgs } from 'react-router';
import type { AppointmentSessionDto } from 'tmp/openapi/gen/booking';
import type { ApiClientError } from '~/api/clients/http';
import { createAppointmentSession, getSession } from '~/lib/appointments.server';
import { ROUTES_MAP } from '~/lib/route-tree';
import { bookingApi } from '~/lib/utils';

export type AppointmentsLayoutLoaderData = {
  session?: AppointmentSessionDto | null;
  error?: string;
};

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const url = new URL(request.url);
    const companyId = url.searchParams.get('companyId');

    if (companyId) {
      await bookingApi().AppointmentsControllerService.AppointmentsControllerService.validateCompanyBooking({
        companyId: parseInt(companyId),
      });

      const session = await createAppointmentSession(parseInt(companyId));

      return redirect(ROUTES_MAP['booking.public.appointment.session.contact'].href, {
        headers: {
          'Set-Cookie': session.setCookieHeader,
        },
      });
    } else {
      const session = await getSession(request);

      if (session) {
        await bookingApi().AppointmentsControllerService.AppointmentsControllerService.validateCompanyBooking({
          companyId: session.companyId,
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
