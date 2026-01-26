import * as React from 'react';
import { data, useFetcher } from 'react-router';
import type { Route } from './+types/booking.public.appointment.session.contact.route';
import { getSession } from '~/lib/appointments.server';
import { authService, AuthenticationError } from '~/lib/auth-service';
import { resolveErrorPayload } from '~/lib/api-error';
import { NoUserSessionNoAuthUserFlow } from './_flows/no-user-session-no-auth-user.flow';
import { CONTACT_SIGN_UP_FETCHER_KEY } from './_forms/fetcher-keys';
import { handleSignUp } from '~/routes/auth/_features/sign-up.handler';
import { AuthController } from '~/api/generated/identity';
import { PublicAppointmentSessionController } from '~/api/generated/booking';

export const ACTION_INTENT = {
  SIGN_UP_LOCAL: 'sign_up_local',
} as const;

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

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const intent = String(formData.get('intent') || '');

  if (intent === ACTION_INTENT.SIGN_UP_LOCAL) {
    const result = await handleSignUp(formData);

    if (!result.ok) {
      return data(
        {
          error: result.error,
          values: result.values,
        },
        { status: result.status },
      );
    }

    const session = await getSession(request);
    const userId = result.signUp.userId;

    if (session?.sessionId && userId) {
      await PublicAppointmentSessionController.setPendingAppointmentSessionUser({
        path: { sessionId: session.sessionId },
        query: { userId },
      });
    }

    return data({
      signUp: result.signUp,
      error: null as string | null,
    });
  }

  return data({ error: 'Ukjent handling' }, { status: 400 });
}

export default function BookingPublicAppointmentSessionContactRoute({ loaderData }: Route.ComponentProps) {
  const { session, authSession } = loaderData;
  const signUpFetcher = useFetcher({ key: CONTACT_SIGN_UP_FETCHER_KEY });
  const [signUpResponse, setSignUpResponse] = React.useState<unknown | null>(null);

  React.useEffect(() => {
    if (!signUpFetcher.data) return;
    setSignUpResponse(signUpFetcher.data);
  }, [signUpFetcher.data]);

  if (session && !session.userId && !authSession) {
    return <NoUserSessionNoAuthUserFlow />;
  }

  return (
    <div className="space-y-4">
      {signUpResponse ? (
        <pre className="rounded-md border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
          {JSON.stringify(signUpResponse, null, 2)}
        </pre>
      ) : null}
    </div>
  );
}
