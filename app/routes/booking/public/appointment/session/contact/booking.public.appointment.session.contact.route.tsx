import * as React from 'react';
import { data, useFetcher } from 'react-router';
import type { Route } from './+types/booking.public.appointment.session.contact.route';
import { getSession } from '~/lib/appointments.server';
import { authService, AuthenticationError } from '~/lib/auth-service';
import { resolveErrorPayload } from '~/lib/api-error';
import { NoUserSessionNoAuthUserFlow } from './_flows/no-user-session-no-auth-user.flow';
import { CONTACT_SIGN_UP_FETCHER_KEY } from './_forms/fetcher-keys';

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
  const { session, authSession } = loaderData;

  const signUpFetcher = useFetcher({ key: CONTACT_SIGN_UP_FETCHER_KEY });

  React.useEffect(() => {
    if (signUpFetcher.data) {
      console.log('[booking-contact] sign-up response', signUpFetcher.data);
    }
  }, [signUpFetcher.data]);

  if (session && !session.userId && !authSession) {
    return <NoUserSessionNoAuthUserFlow />;
  }

  return <div />;
}
