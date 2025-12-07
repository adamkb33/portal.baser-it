import { type LoaderFunctionArgs, redirect, data } from 'react-router';
import type { ApiClientError } from '~/api/clients/http';
import { getSession } from '~/lib/appointments.server';
import { ROUTES_MAP } from '~/lib/route-tree';
import { bookingApi } from '~/lib/utils';

export async function appointmentSessionSelectTimeAction({ request }: LoaderFunctionArgs) {
  const session = await getSession(request);
  if (!session) {
    return redirect(ROUTES_MAP['booking.public.appointment'].href);
  }

  const formData = await request.formData();
  const selectedStartTime = formData.get('selectedStartTime') as string;

  try {
    await bookingApi().PublicAppointmentSessionControllerService.PublicAppointmentSessionControllerService.submitAppointmentSessionStartTime(
      {
        sessionId: session.sessionId,
        selectedStartTime,
      },
    );

    return redirect(ROUTES_MAP['booking.public.appointment.session.overview'].href);
  } catch (error) {
    console.error(JSON.stringify(error, null, 2));
    if ((error as ApiClientError).body) {
      return { error: (error as ApiClientError).body.message };
    }
    throw error;
  }
}
