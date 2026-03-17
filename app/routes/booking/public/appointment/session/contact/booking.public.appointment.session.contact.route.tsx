import * as React from 'react';
import { LogIn, UserPlus } from 'lucide-react';
import { data, Form, redirect, useNavigate } from 'react-router';
import { ProviderButtons } from '~/routes/auth/_components/provider-buttons';
import type { UserAuthStatusDto } from '~/api/generated/base';
import { ROUTES_MAP } from '~/lib/route-tree';
import { redirectWithError, redirectWithInfo } from '~/routes/company/_lib/flash-message.server';
import { resolveErrorPayload } from '~/lib/api-error';
import type { Route } from './+types/booking.public.appointment.session.contact.route';
import { resolveAuthNextStepHref, resolveAuthStatusNextStepHref } from './_utils/auth.utils';
import { authService } from '~/lib/auth-service';
import { ContactSessionService } from './_services/contact-session.service.server';
import { accessTokenCookie, refreshTokenCookie } from '~/routes/auth/_features/auth.cookies.server';
import { logger } from '~/lib/logger';
import { Button, Card, CardDescription, CardFooter, CardHeader, CardTitle, Grid, PageHeader, Panel, Stack, Text } from '~/ui';

const ACTION_INTENT = {
  CONTINUE_WITH_SESSION_USER: 'continue-with-session-user',
  CONTINUE_WITH_PROVIDER: 'continue-with-provider',
  CONTINUE_WITH_AUTHENTICATED_USER: 'continue-with-authenticated-user',
} as const;

type ContinueCardProps = {
  title: string;
  description?: string;
  cta: string;
  initials?: string;
  intentValue: string;
};

function ContinueCard({ title, description, cta, initials, intentValue }: ContinueCardProps) {
  return (
    <Form method="post">
      <button
        type="submit"
        name="intent"
        value={intentValue}
        className="group w-full rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-booking-action"
      >
        <Card
          variant="interactive"
          size="sm"
          className="cursor-pointer border-booking-border bg-booking-surface transition-colors group-hover:bg-booking-surface-muted group-focus-visible:border-booking-action"
        >
          <CardHeader>
            <div className="flex gap-4">
              {initials ? (
                <div className="flex size-10 items-center justify-center rounded-full bg-booking-surface-muted text-sm font-semibold text-booking-text-muted">
                  {initials}
                </div>
              ) : null}
              <div className="flex flex-col">
                <CardTitle className="text-booking-text">{title}</CardTitle>
                {description ? <CardDescription className="text-booking-text-muted">{description}</CardDescription> : null}
              </div>
            </div>
          </CardHeader>
          <CardFooter>
            <div className="inline-flex w-full items-center justify-center gap-2 text-sm font-medium text-booking-text">
              <LogIn className="size-5" />
              {cta}
            </div>
          </CardFooter>
        </Card>
      </button>
    </Form>
  );
}

export async function loader({ request }: Route.LoaderArgs) {
  try {
    const { session, sessionUser, auth, verificationSessionToken } =
      await ContactSessionService.getContactContext(request);

    if (!session) {
      return redirectWithError(
        request,
        ROUTES_MAP['booking.public.appointment.session'].href,
        'Kunne ikke hente session',
      );
    }

    return data({
      session,
      sessionUser,
      auth,
      verificationSessionToken,
    });
  } catch (error) {
    const { message } = resolveErrorPayload(error, 'Kunne ikke hente session');
    return redirectWithError(request, ROUTES_MAP['booking.public.appointment.session'].href, message);
  }
}

export async function action({ request }: Route.ActionArgs) {
  const { AppointmentSessionService } = await import('../_services/appointment-session.service.server');
  const { ContactAuthService } = await import('./_services/contact-auth.service.server');
  const formData = await request.formData();
  const intent = formData.get('intent');

  try {
    if (intent === ACTION_INTENT.CONTINUE_WITH_AUTHENTICATED_USER) {
      const auth = await authService.getAuth(request);
      if (!auth) {
        return redirectWithError(
          request,
          ROUTES_MAP['booking.public.appointment.session.contact'].href,
          'Kunne ikke hente autentisering',
        );
      }

      await AppointmentSessionService.attachUser(request, auth.id);

      return redirect(ROUTES_MAP['booking.public.appointment.session.employee'].href);
    }

    if (intent === ACTION_INTENT.CONTINUE_WITH_SESSION_USER) {
      const session = await AppointmentSessionService.get(request);
      logger.info('[booking.public.appointment.session.contact] CONTINUE_WITH_SESSION_USER', { session });
      if (!session) {
        logger.error('[booking.public.appointment.session.contact] CONTINUE_WITH_SESSION_USER no session');
        return redirectWithError(
          request,
          ROUTES_MAP['booking.public.appointment.session'].href,
          'Kunne ikke hente session, prøv å start på nytt',
        );
      }

      if (!session.userId) {
        logger.error('[booking.public.appointment.session.contact] CONTINUE_WITH_SESSION_USER no userId');
        return redirectWithError(
          request,
          ROUTES_MAP['booking.public.appointment.session.contact'].href,
          'Kunne ikke hente bruker-ID',
        );
      }

      const sessionUser = await ContactSessionService.getSessionUserStatus(request);
      if (!sessionUser) {
        logger.error('[booking.public.appointment.session.contact] CONTINUE_WITH_SESSION_USER no sessionUser');
        return redirect(`${ROUTES_MAP['booking.public.appointment.session.contact.sign-in'].href}`);
      }

      const auth = await authService.getAuth(request);
      if (!auth) {
        logger.error('[booking.public.appointment.session.contact] CONTINUE_WITH_SESSION_USER no auth');
        const signInHref = ROUTES_MAP['booking.public.appointment.session.contact.sign-in'].href;
        const params = new URLSearchParams();
        if (sessionUser.user.email) {
          params.set('email', sessionUser.user.email);
        }
        if (sessionUser.user.provider) {
          params.set('provider', sessionUser.user.provider);
        }
        return redirect(params.toString() ? `${signInHref}?${params.toString()}` : signInHref);
      }

      const profileStatus = await ContactSessionService.getSessionUserStatus(request);

      if (!profileStatus) {
        logger.error('[booking.public.appointment.session.contact] CONTINUE_WITH_SESSION_USER no profileStatus');
        return redirectWithError(
          request,
          ROUTES_MAP['booking.public.appointment.session.contact'].href,
          'Kunne ikke hente brukerstatus',
        );
      }

      const nextStepHref = resolveAuthNextStepHref(profileStatus.nextStep);
      if (nextStepHref) {
        logger.info('[booking.public.appointment.session.contact] CONTINUE_WITH_SESSION_USER', { nextStepHref });
        return redirect(nextStepHref);
      }

      return redirect(ROUTES_MAP['booking.public.appointment.session.employee'].href);
    }

    if (intent === ACTION_INTENT.CONTINUE_WITH_PROVIDER) {
      const provider = String(formData.get('provider') || 'LOCAL');
      const idToken = String(formData.get('idToken') || '');
      const redirectUrl = String(formData.get('redirectUrl') || '');
      const isGoogleLogin = provider === 'GOOGLE';

      if (!isGoogleLogin) {
        return redirectWithError(
          request,
          ROUTES_MAP['booking.public.appointment.session.contact'].href,
          'Ugyldig innloggingsleverandør.',
        );
      }

      if (isGoogleLogin && !idToken) {
        return redirectWithError(
          request,
          ROUTES_MAP['booking.public.appointment.session.contact'].href,
          'Kunne ikke logge inn med Google. Prøv igjen.',
        );
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

      return redirectWithInfo(
        request,
        ROUTES_MAP['booking.public.appointment.session.contact'].href,
        'Kunne ikke logge inn. Prøv igjen.',
      );
    }

    return redirectWithError(
      request,
      ROUTES_MAP['booking.public.appointment.session.contact'].href,
      'Ugyldig handling.',
    );
  } catch (error) {
    const { message } = resolveErrorPayload(error, 'Kunne ikke fortsette. Prøv igjen.');
    return redirectWithError(request, ROUTES_MAP['booking.public.appointment.session.contact'].href, message);
  }
}

export default function BookingPublicAppointmentSessionContactRoute({ loaderData }: Route.ComponentProps) {
  const { sessionUser, auth, verificationSessionToken } = loaderData;
  const navigate = useNavigate();
  const sessionUserEmail = sessionUser?.user.email?.toLowerCase();
  const authEmail = auth?.email?.toLowerCase();
  const isSameSessionAndAuthenticatedUser = Boolean(
    sessionUser &&
      auth &&
      (sessionUser.user.id === auth.id || (sessionUserEmail && authEmail && sessionUserEmail === authEmail)),
  );
  const sessionInitials =
    `${sessionUser?.user.givenName?.[0] ?? ''}${sessionUser?.user.familyName?.[0] ?? ''}`.toUpperCase() || 'U';

  const goToSignIn = React.useCallback(
    (authStatus?: UserAuthStatusDto | null) => {
      const nextStepHref = resolveAuthStatusNextStepHref(authStatus);
      if (nextStepHref) {
        navigate(nextStepHref);
        return;
      }
      const email = authStatus?.user?.email;
      const signInHref = email ? `sign-in?email=${email}` : 'sign-in';
      navigate(signInHref);
    },
    [navigate],
  );

  const goToSignUp = React.useCallback(() => navigate('sign-up'), [navigate]);

  return (
    <>
      <Stack space="xl">
        <PageHeader
          label="Kontakt"
          title="Hvordan vil du fortsette?"
          description="Velg en av de følgende metodene for å fortsette."
        />

        <Panel title="Velg innloggingsmetode" tone="muted">
          <Stack space="lg">
            {sessionUser && !isSameSessionAndAuthenticatedUser && (
              <ContinueCard
                title={`${sessionUser.user.givenName} ${sessionUser.user.familyName}`}
                description="Vi fant en eksisterende bruker. Fortsett for å verifisere og gå videre."
                cta="Fortsett med denne brukeren"
                initials={sessionInitials}
                intentValue={ACTION_INTENT.CONTINUE_WITH_SESSION_USER}
              />
            )}
            {auth && !isSameSessionAndAuthenticatedUser && (
              <ContinueCard
                title={auth.email}
                cta="Fortsett med innlogget bruker"
                intentValue={ACTION_INTENT.CONTINUE_WITH_AUTHENTICATED_USER}
              />
            )}
            {sessionUser && auth && isSameSessionAndAuthenticatedUser && (
              <ContinueCard
                title={`${sessionUser.user.givenName} ${sessionUser.user.familyName}`}
                description="Fortsett for å verifisere kontaktopplysningene dine."
                cta="Fortsett som innlogget bruker"
                initials={sessionInitials}
                intentValue={ACTION_INTENT.CONTINUE_WITH_AUTHENTICATED_USER}
              />
            )}
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
                  onClick={() => goToSignIn()}
                  className="gap-3"
                >
                  <LogIn className="size-5" />
                  Logg inn
                </Button>
                <Text as="p" variant="body-sm" className="text-text-secondary">
                  Fortsett med en eksisterende konto.
                </Text>
              </div>
              <div className="space-y-2">
                <Button
                  type="button"
                  size="lg"
                  fullWidth
                  variant="outline"
                  onClick={goToSignUp}
                  className="gap-3"
                >
                  <UserPlus className="size-5" />
                  Opprett konto
                </Button>
                <Text as="p" variant="body-sm" className="text-text-secondary">
                  Ny her? Lag en konto på et minutt.
                </Text>
              </div>
            </Grid>
          </Stack>
        </Panel>
      </Stack>
    </>
  );
}
