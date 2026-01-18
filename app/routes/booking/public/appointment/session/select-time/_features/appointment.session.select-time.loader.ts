import { type LoaderFunctionArgs, redirect } from 'react-router';
import { getSession } from '~/lib/appointments.server';
import { ROUTES_MAP } from '~/lib/route-tree';
import { PublicAppointmentSessionController } from '~/api/generated/booking';
import { handleRouteError } from '~/lib/api-error';

export async function appointmentSessionSelectTimeAction(args: LoaderFunctionArgs) {
  const session = await getSession(args.request);
  if (!session) {
    return redirect(ROUTES_MAP['booking.public.appointment'].href);
  }

  const formData = await args.request.formData();
  const selectedStartTime = formData.get('selectedStartTime') as string;

  try {
    await PublicAppointmentSessionController.submitAppointmentSessionStartTime({
      query: {
        sessionId: session.sessionId,
        selectedStartTime,
      },
    });

    return redirect(ROUTES_MAP['booking.public.appointment.session.overview'].href);
  } catch (error) {
    return handleRouteError(error, args, { fallbackMessage: 'Kunne ikke lagre tidspunkt' });
  }
}
