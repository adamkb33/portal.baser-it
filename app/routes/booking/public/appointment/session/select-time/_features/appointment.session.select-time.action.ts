import { data, redirect, type ActionFunctionArgs } from 'react-router';
import type { ApiClientError } from '~/api/clients/http';
import { getSession } from '~/lib/appointments.server';
import { ROUTES_MAP } from '~/lib/route-tree';
import { bookingApi } from '~/lib/utils';
import type { AppointmentsSelectTimeLoaderData } from '../booking.public.appointment.session.select-time.route';

export async function appointmentSessionSelectTimeLoader({ request }: ActionFunctionArgs) {
  const session = await getSession(request);
  if (!session) {
    return redirect(ROUTES_MAP['booking.public.appointment'].href);
  }

  try {
    const schedulesResponse =
      await bookingApi().PublicAppointmentSessionControllerService.PublicAppointmentSessionControllerService.getAppointmentSessionSchedules(
        {
          sessionId: session.sessionId,
        },
      );

    return data<AppointmentsSelectTimeLoaderData>({
      session,
      schedules: schedulesResponse.data || [],
    });
  } catch (error) {
    console.error(JSON.stringify(error, null, 2));
    if ((error as ApiClientError).body) {
      return { error: (error as ApiClientError).body.message };
    }
    throw error;
  }
}
