import { data } from 'react-router';
import type { Route } from './+types/booking.public.appointment.session.contact.route';
import { getSession } from '~/lib/appointments.server';
import { authService, AuthenticationError } from '~/lib/auth-service';
import { resolveErrorPayload } from '~/lib/api-error';
import { NoUserSessionNoAuthUserFlow } from './_flows/no-user-session-no-auth-user.flow';

export async function loader({ request }: Route.LoaderArgs) {
  try {
    let authSession: Awaited<ReturnType<typeof authService.getUserSession>> | null = null;
    let session = null;

    try {
      authSession = await authService.getUserSession(request);
    } catch (error) {
      if (!(error instanceof AuthenticationError)) {
        throw error;
      }
    }

    try {
      session = await getSession(request);
    } catch {
      session = null;
    }

    return data({
      session,
      authSession,
      error: null as string | null,
    });
  } catch (error) {
    const { message, status } = resolveErrorPayload(error, 'Kunne ikke hente kontaktinformasjon');
    return data(
      {
        session: null,
        authSession: null,
        error: message,
      },
      { status: status ?? 400 },
    );
  }
}

export default function BookingPublicAppointmentSessionContactRoute({ loaderData }: Route.ComponentProps) {
  if (loaderData.session && !loaderData.session.userId && !loaderData.authSession) {
    return <NoUserSessionNoAuthUserFlow />;
  }

  return <div />;
}
