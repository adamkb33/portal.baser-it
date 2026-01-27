import * as React from 'react';
import { data, redirect, useFetcher } from 'react-router';
import type { Route } from './+types/booking.public.appointment.session.contact.route';
import { getSession } from '~/lib/appointments.server';
import { authService, AuthenticationError } from '~/lib/auth-service';
import { withAuth } from '~/api/utils/with-auth';
import { resolveErrorPayload } from '~/lib/api-error';
import { NoUserSessionNoAuthUserFlow } from './_flows/no-user-session-no-auth-user.flow';
import { CONTACT_SIGN_UP_FETCHER_KEY } from './_forms/fetcher-keys';
import { handleSignUp } from '~/routes/auth/_features/sign-up.handler';
import { PublicAppointmentSessionController } from '~/api/generated/booking';
import { VerifyEmailFlow } from './_flows/verify-email.flow';
import { VerifyMobileFlow } from './_flows/verify-mobile.flow';
import { CONTACT_VERIFICATION_TOKEN_STORAGE_KEY } from './_forms/session-keys';
import { decodeFromRequest, ensureEncodedCompanyIdRedirect } from '~/lib/company-id-url.server';
import { ROUTES_MAP } from '~/lib/route-tree';

export const ACTION_INTENT = {
  SIGN_UP_LOCAL: 'sign_up_local',
  CLEAR_SESSION: 'clear_session',
} as const;

export async function loader({ request }: Route.LoaderArgs) {
  try {
    const companyIdFromUrl = decodeFromRequest(request);

    let authSession: Awaited<ReturnType<typeof authService.getUserSession>> | null = null;
    let accessToken: string | null = null;

    const session = await getSession(request);
    if (!session) {
      return redirect(ROUTES_MAP['booking.public.appointment'].href);
    }

    try {
      const userSession = await authService.getUserSession(request);
      authSession = userSession;
      accessToken = userSession.accessToken;
    } catch (error) {
      if (!(error instanceof AuthenticationError)) {
        throw error;
      }
    }

    let sessionUser = null;

    if (session?.userId) {
      try {
        sessionUser = accessToken
          ? await withAuth(
              request,
              async () => {
                const response = await PublicAppointmentSessionController.getPendingAppointmentSessionUser({
                  path: { sessionId: session.sessionId },
                });
                return response.data?.data ?? null;
              },
              accessToken,
            )
          : ((
              await PublicAppointmentSessionController.getPendingAppointmentSessionUser({
                path: { sessionId: session.sessionId },
              })
            ).data?.data ?? null);
      } catch {
        sessionUser = null;
      }
    }

    const ensuredCompanyId = session?.companyId ?? companyIdFromUrl;

    const redirectResponse = ensureEncodedCompanyIdRedirect(request, ensuredCompanyId);
    if (redirectResponse) {
      return redirectResponse;
    }

    return data({
      session,
      authSession,
      sessionUser,
      error: null as string | null,
    });
  } catch (error) {
    const { message, status } = resolveErrorPayload(error, 'Kunne ikke hente kontaktinformasjon');
    return data(
      {
        session: null,
        authSession: null,
        sessionUser: null,
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
    if (!session) {
      return redirect(ROUTES_MAP['booking.public.appointment'].href);
    }
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

  if (intent === ACTION_INTENT.CLEAR_SESSION) {
    try {
      const session = await getSession(request);
      if (!session) {
        return redirect(ROUTES_MAP['booking.public.appointment'].href);
      }
      if (session?.sessionId) {
        await PublicAppointmentSessionController.clearAppointmentSessionUser({
          path: { sessionId: session.sessionId },
        });
      }
      return data({ cleared: true });
    } catch (error) {
      const { message, status } = resolveErrorPayload(error, 'Kunne ikke slette brukerdata.');
      return data({ error: message }, { status: status ?? 400 });
    }
  }

  return data({ error: 'Ukjent handling' }, { status: 400 });
}

export default function BookingPublicAppointmentSessionContactRoute({ loaderData }: Route.ComponentProps) {
  const { session, authSession, sessionUser } = loaderData;
  const signUpFetcher = useFetcher({ key: CONTACT_SIGN_UP_FETCHER_KEY });
  const [signUpResponse, setSignUpResponse] = React.useState<unknown | null>(null);

  React.useEffect(() => {
    console.log('[booking-contact] session details', { session, authSession, sessionUser });
  }, [session, authSession]);

  React.useEffect(() => {
    if (!signUpFetcher.data) return;
    setSignUpResponse(signUpFetcher.data);
    const data = signUpFetcher.data as { signUp?: { verificationSessionToken?: string } };
    const token = data.signUp?.verificationSessionToken;
    if (token && typeof window !== 'undefined') {
      window.sessionStorage.setItem(CONTACT_VERIFICATION_TOKEN_STORAGE_KEY, token);
    }
  }, [signUpFetcher.data]);

  if (session && !session.userId && !authSession) {
    return <NoUserSessionNoAuthUserFlow />;
  }

  if (session && session.userId && sessionUser?.userDto && sessionUser.nextStep === 'VERIFY_EMAIL') {
    return <VerifyEmailFlow />;
  }

  if (session && session.userId && sessionUser?.userDto && sessionUser.nextStep === 'VERIFY_MOBILE') {
    return <VerifyMobileFlow email={sessionUser.userDto.email ?? ''} />;
  }

  return (
    <div className="space-y-4">
      {sessionUser ? (
        <pre className="rounded-md border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
          {JSON.stringify(sessionUser, null, 2)}
        </pre>
      ) : null}
      {signUpResponse ? (
        <pre className="rounded-md border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
          {JSON.stringify(signUpResponse, null, 2)}
        </pre>
      ) : null}
    </div>
  );
}
