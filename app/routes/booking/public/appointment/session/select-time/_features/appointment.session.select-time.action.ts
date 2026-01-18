import { data, redirect, type ActionFunctionArgs } from 'react-router';
import { getSession } from '~/lib/appointments.server';
import { ROUTES_MAP } from '~/lib/route-tree';
import type { AppointmentsSelectTimeLoaderData } from '../booking.public.appointment.session.select-time.route';
import { PublicAppointmentSessionController } from '~/api/generated/booking';
import { handleRouteError } from '~/lib/api-error';

export async function appointmentSessionSelectTimeLoader(args: ActionFunctionArgs) {
  const session = await getSession(args.request);
  if (!session) {
    return redirect(ROUTES_MAP['booking.public.appointment'].href);
  }

  try {
    const schedulesResponse =
      await PublicAppointmentSessionController.getAppointmentSessionSchedules(
        {
          query: {
            sessionId: session.sessionId,
          },
        },
      );

    return data<AppointmentsSelectTimeLoaderData>({
      ok: true,
      session,
      schedules: schedulesResponse.data?.data || [],
    });
  } catch (error) {
    return handleRouteError(error, args, { fallbackMessage: 'Kunne ikke hente tilgjengelige tider' });
  }
}
