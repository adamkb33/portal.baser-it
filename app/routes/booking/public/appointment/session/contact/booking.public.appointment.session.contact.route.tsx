import { getBookingRouteMap } from '~/routes/booking/public/_utils/booking.route-map';
import type { Route } from './+types/booking.public.appointment.session.contact.route';
import { ContactSessionService } from './_services/contact-session.service.server';
import { redirectWithError, redirectWithInfo } from '~/lib/flash-message.server';
import { AppointmentSessionService } from '~/routes/booking/public/_services/booking.appointment-session.service.server';
import { data, redirect } from 'react-router';
import { resolveErrorPayload } from '~/lib/api-error';
import React from 'react';
import { Form, Link, useNavigate } from 'react-router';
import { CalendarClock, LogIn, RefreshCcw, UserCheck, UserPlus } from 'lucide-react';
import { ProviderButtons } from '~/routes/auth/_components/provider-buttons';
import type { UserAuthStatusDto } from '~/api/generated/base';
import { Button, Grid, Inline, PageHeader, Panel, Stack, Text } from '~/ui';
import { BOOKING_CONTACT_PAGE_HEADER_CLASS, BOOKING_CONTACT_PANEL_CLASS } from './_utils/booking-contact-theme';
import { resolveAuthNextStepHref, resolveAuthStatusNextStepHref } from './_utils/auth.utils';
import { ContinueCard } from './_components/continue-card';
import { authService } from '~/lib/auth-service';
import { logger } from '~/lib/logger';
import { ContactAuthService } from './_services/contact-auth.service.server';
import { accessTokenCookie, refreshTokenCookie } from '~/routes/auth/_features/auth.cookies.server';

export async function loader({ request }: Route.LoaderArgs) {
  const routes = getBookingRouteMap();

  try {
    const { session, sessionStatus, sessionUser, auth, verificationSessionToken } =
      await ContactSessionService.getContactContext(request);

    if (!session) {
      if (sessionStatus === 'stale-cookie') {
        const clearSessionCookie = await AppointmentSessionService.delete(request);
        return redirectWithError(request, routes.appointment, 'Bookingøkten er utløpt. Start på nytt.', {
          'Set-Cookie': clearSessionCookie,
        });
      }

      return redirectWithError(request, routes.session, 'Kunne ikke hente session');
    }

    return data({
      session,
      sessionUser,
      auth,
      verificationSessionToken,
      navigation: {
        myAppointments: routes.myAppointments,
      },
    });
  } catch (error) {
    const { message } = resolveErrorPayload(error, 'Kunne ikke hente session');
    return redirectWithError(request, routes.session, message);
  }
}

export async function action({ request }: Route.ActionArgs) {
  const routes = getBookingRouteMap();
  const formData = await request.formData();
  const intent = formData.get('intent');

  try {
    if (intent === ACTION_INTENT.CONTINUE_WITH_AUTHENTICATED_USER) {
      const auth = await authService.getAuth(request);
      if (!auth) {
        return redirectWithError(request, routes.contact, 'Kunne ikke hente autentisering');
      }

      await AppointmentSessionService.attachUser(request, auth.id);

      return redirect(routes.employee);
    }

    if (intent === ACTION_INTENT.CONTINUE_WITH_SESSION_USER) {
      const session = await AppointmentSessionService.get(request);
      logger.info('[booking.public.appointment.session.contact] CONTINUE_WITH_SESSION_USER', { session });
      if (!session) {
        logger.error('[booking.public.appointment.session.contact] CONTINUE_WITH_SESSION_USER no session');
        return redirectWithError(request, routes.contact, 'Kunne ikke hente session, prøv å start på nytt');
      }

      if (!session.userId) {
        logger.error('[booking.public.appointment.session.contact] CONTINUE_WITH_SESSION_USER no userId');
        return redirectWithError(request, routes.contact, 'Kunne ikke hente bruker-ID');
      }

      const sessionUser = await ContactSessionService.getSessionUserStatus(request);
      if (!sessionUser) {
        logger.error('[booking.public.appointment.session.contact] CONTINUE_WITH_SESSION_USER no sessionUser');
        return redirectWithError(request, routes.contact, 'Kunne ikke hente session-bruker');
      }

      const auth = await authService.getAuth(request);
      if (!auth) {
        logger.error('[booking.public.appointment.session.contact] CONTINUE_WITH_SESSION_USER no auth');
        const params = new URLSearchParams();
        if (sessionUser.user.email) {
          params.set('email', sessionUser.user.email);
        }
        if (sessionUser.user.provider) {
          params.set('provider', sessionUser.user.provider);
        }
        return redirect(params.toString() ? `${routes.contactSignIn}?${params.toString()}` : routes.contactSignIn);
      }

      const profileStatus = await ContactSessionService.getSessionUserStatus(request);

      if (!profileStatus) {
        logger.error('[booking.public.appointment.session.contact] CONTINUE_WITH_SESSION_USER no profileStatus');
        return redirectWithError(request, routes.contact, 'Kunne ikke hente brukerstatus');
      }

      const nextStepHref = resolveAuthNextStepHref(profileStatus.nextStep);
      if (nextStepHref) {
        logger.info('[booking.public.appointment.session.contact] CONTINUE_WITH_SESSION_USER', { nextStepHref });
        return redirect(nextStepHref);
      }

      return redirect(routes.employee);
    }

    if (intent === ACTION_INTENT.CONTINUE_WITH_PROVIDER) {
      const provider = String(formData.get('provider') || 'LOCAL');
      const idToken = String(formData.get('idToken') || '');
      const redirectUrl = String(formData.get('redirectUrl') || '');
      const isGoogleLogin = provider === 'GOOGLE';

      if (!isGoogleLogin) {
        return redirectWithError(request, routes.contact, 'Ugyldig innloggingsleverandør.');
      }

      if (isGoogleLogin && !idToken) {
        return redirectWithError(request, routes.contact, 'Kunne ikke logge inn med Google. Prøv igjen.');
      }

      const response = await ContactAuthService.signInWithProvider({
        provider: 'GOOGLE',
        idToken,
        redirectUrl,
      });

      if (response?.userId) {
        await ContactAuthService.attachUserToSession(request, response.userId);
      }
      let headers = new Headers();

      if (response?.authTokens) {
        headers.append('Set-Cookie', response.authTokens.accessToken);
        headers.append('Set-Cookie', response.authTokens.refreshToken);
        headers.append(
          'Set-Cookie',
          await accessTokenCookie.serialize(response.authTokens.accessToken, {
            expires: new Date(response.authTokens.accessTokenExpiresAt * 1000),
          }),
        );
        headers.append(
          'Set-Cookie',
          await refreshTokenCookie.serialize(response.authTokens.refreshToken, {
            expires: new Date(response.authTokens.refreshTokenExpiresAt * 1000),
          }),
        );
      }

      const { nextStepHref, verificationCookieHeader } = await ContactAuthService.resolvePostAuthRedirect(response);
      if (verificationCookieHeader) {
        headers.append('Set-Cookie', verificationCookieHeader);
      }

      if (nextStepHref) {
        return redirect(nextStepHref, { headers });
      }

      return redirectWithInfo(request, routes.contact, 'Kunne ikke logge inn. Prøv igjen.');
    }

    return redirectWithError(request, routes.contact, 'Ugyldig handling.');
  } catch (error) {
    const { message } = resolveErrorPayload(error, 'Kunne ikke fortsette. Prøv igjen.');
    return redirectWithError(request, routes.contact, message);
  }
}

const ACTION_INTENT = {
  CONTINUE_WITH_SESSION_USER: 'continue-with-session-user',
  CONTINUE_WITH_PROVIDER: 'continue-with-provider',
  CONTINUE_WITH_AUTHENTICATED_USER: 'continue-with-authenticated-user',
} as const;

export default function BookingSessionContactPage({ loaderData }: Route.ComponentProps) {
  const { sessionUser, auth, navigation } = loaderData;

  const navigate = useNavigate();
  const [showSwitchOptions, setShowSwitchOptions] = React.useState(false);

  const sessionUserEmail = sessionUser?.user.email?.toLowerCase();
  const authEmail = auth?.email?.toLowerCase();

  const isSameUser = Boolean(
    sessionUser &&
      auth &&
      (sessionUser.user.id === auth.id || (sessionUserEmail && authEmail && sessionUserEmail === authEmail)),
  );

  const sessionInitials =
    `${sessionUser?.user.givenName?.[0] ?? ''}${sessionUser?.user.familyName?.[0] ?? ''}`.toUpperCase() || 'U';
  const matchedSessionUserName =
    sessionUser && isSameUser ? `${sessionUser.user.givenName} ${sessionUser.user.familyName}`.trim() : '';
  const authDisplayName = matchedSessionUserName || auth?.email || (auth ? `Bruker #${auth.id}` : 'innlogget bruker');
  const authSupportingText =
    sessionUser && isSameUser && sessionUser.user.email
      ? sessionUser.user.email
      : 'Kontaktinformasjonen verifiseres før du går videre.';
  const authInitials =
    matchedSessionUserName
      .split(/\s+/)
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() ||
    auth?.email?.[0]?.toUpperCase() ||
    'U';

  const goToSignIn = React.useCallback(
    (authStatus?: UserAuthStatusDto | null) => {
      const nextStepHref = resolveAuthStatusNextStepHref(authStatus);
      if (nextStepHref) {
        navigate(nextStepHref);
        return;
      }
      const email = authStatus?.user?.email;
      navigate(email ? `sign-in?email=${email}` : 'sign-in');
    },
    [navigate],
  );

  const goToSignUp = React.useCallback(() => navigate('sign-up'), [navigate]);

  return (
    <Stack space="xl">
      <PageHeader
        label="Kontakt"
        title="Hvordan vil du fortsette?"
        description="Velg en av de følgende metodene for å fortsette."
        className={BOOKING_CONTACT_PAGE_HEADER_CLASS}
      />

      <Panel
        title={auth ? 'Innlogget bruker' : 'Velg innloggingsmetode'}
        tone="muted"
        className={BOOKING_CONTACT_PANEL_CLASS}
      >
        <Stack space="lg">
          {auth ? (
            <div className="rounded-[var(--radius-booking-panel)] border-[length:var(--border-booking-card)] border-booking-border bg-booking-surface-raised p-4 shadow-[var(--shadow-booking-card)] md:p-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-[var(--radius-booking-badge)] bg-booking-action text-base font-semibold text-booking-action-contrast">
                    {authInitials}
                  </div>
                  <div className="min-w-0">
                    <Text as="p" variant="label" className="text-booking-text">
                      Du er logget inn som
                    </Text>
                    <Text as="p" variant="heading-sm" className="truncate text-booking-text">
                      {authDisplayName}
                    </Text>
                    <Text as="p" variant="body-sm" className="text-booking-text-muted">
                      {authSupportingText}
                    </Text>
                  </div>
                </div>

                <Inline space="sm" wrap>
                  <Link
                    to={navigation.myAppointments}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-[var(--radius-booking-control)] border-[length:var(--border-booking-control)] border-booking-border bg-booking-surface-raised px-4 text-base font-medium text-booking-text transition-colors hover:bg-booking-surface-muted focus-visible:outline-none focus-visible:ring-[length:var(--border-booking-focus-ring)] focus-visible:ring-booking-action"
                  >
                    <CalendarClock className="size-4" />
                    Mine bookinger
                  </Link>
                  <Button
                    type="button"
                    variant="booking-secondary"
                    className="gap-2"
                    onClick={() => setShowSwitchOptions((prev) => !prev)}
                  >
                    <RefreshCcw className="size-4" />
                    Bytt bruker
                  </Button>
                </Inline>
              </div>

              <Form method="post" className="mt-4">
                <input type="hidden" name="intent" value={ACTION_INTENT.CONTINUE_WITH_AUTHENTICATED_USER} />
                <Button type="submit" size="lg" fullWidth variant="booking-primary" className="gap-3">
                  <UserCheck className="size-5" />
                  Fortsett med denne brukeren
                </Button>
              </Form>
            </div>
          ) : null}

          {!auth && sessionUser && (
            <ContinueCard
              title={`${sessionUser.user.givenName} ${sessionUser.user.familyName}`}
              description="Vi fant en eksisterende bruker. Fortsett for å verifisere og gå videre."
              cta="Fortsett med denne brukeren"
              initials={sessionInitials}
              intentValue={ACTION_INTENT.CONTINUE_WITH_SESSION_USER}
            />
          )}

          {(!auth || showSwitchOptions) && (
            <div
              className={
                auth
                  ? 'rounded-[var(--radius-booking-panel)] border-[length:var(--border-booking-card)] border-booking-border bg-booking-surface-raised p-4 md:p-5'
                  : undefined
              }
            >
              <Stack space="md">
                {auth ? (
                  <div>
                    <Text as="p" variant="label" className="text-booking-text">
                      Velg en annen bruker
                    </Text>
                    <Text as="p" variant="body-sm" className="text-booking-text-muted">
                      Logg inn med en annen konto eller opprett en ny bruker for denne bookingen.
                    </Text>
                  </div>
                ) : null}

                <Form method="post">
                  <input type="hidden" name="intent" value={ACTION_INTENT.CONTINUE_WITH_PROVIDER} />
                  <input type="hidden" name="redirectUrl" value="booking" />
                  <ProviderButtons />
                </Form>

                <Grid columns={2} gap="md">
                  <div className="space-y-2">
                    <Button
                      type="button"
                      size="lg"
                      fullWidth
                      variant="booking-primary"
                      onClick={() => goToSignIn()}
                      className="gap-3"
                    >
                      <LogIn className="size-5" />
                      Logg inn
                    </Button>
                    <Text as="p" variant="body-sm" className="text-booking-text-muted">
                      Fortsett med en eksisterende konto.
                    </Text>
                  </div>
                  <div className="space-y-2">
                    <Button
                      type="button"
                      size="lg"
                      fullWidth
                      variant="booking-secondary"
                      onClick={goToSignUp}
                      className="gap-3"
                    >
                      <UserPlus className="size-5" />
                      Opprett konto
                    </Button>
                    <Text as="p" variant="body-sm" className="text-booking-text-muted">
                      Ny her? Lag en konto på et minutt.
                    </Text>
                  </div>
                </Grid>
              </Stack>
            </div>
          )}
        </Stack>
      </Panel>
    </Stack>
  );
}
