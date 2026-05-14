import { data, Form, redirect, useNavigation, Link } from 'react-router';
import type { Route } from './+types/booking.public.appointment.session.contact.sign-up.route';
import { ROUTES_MAP } from '~/lib/route-tree';
import { ChevronLeft, UserPlus } from 'lucide-react';
import { redirectWithError, redirectWithInfo } from '~/lib/flash-message.server';
import { resolveErrorPayload } from '~/lib/api-error';
import { accessTokenCookie, refreshTokenCookie } from '~/routes/auth/_features/auth.cookies.server';
import { resolveAuthNextStepHref } from '../_utils/auth.utils';
import { Button, Input, Label, PageHeader, Panel, Stack } from '~/ui';

function buildSignUpRetryHref(request: Request, fields: Record<string, string>): string {
  const currentUrl = new URL(request.url);
  const retryUrl = new URL(`${currentUrl.pathname}${currentUrl.search}`, currentUrl.origin);

  for (const [key, value] of Object.entries(fields)) {
    if (value) {
      retryUrl.searchParams.set(key, value);
    } else {
      retryUrl.searchParams.delete(key);
    }
  }

  return `${retryUrl.pathname}${retryUrl.search}`;
}

export async function loader({ request }: Route.LoaderArgs) {
  const { AppointmentSessionService } = await import('../../_services/appointment-session.service.server');
  const session = await AppointmentSessionService.get(request);
  if (!session) {
    return redirectWithError(
      request,
      ROUTES_MAP['booking.public.appointment.session'].href,
      'Kunne ikke hente session',
    );
  }
  const url = new URL(request.url);
  return data({
    session,
    defaults: {
      givenName: url.searchParams.get('givenName') || '',
      familyName: url.searchParams.get('familyName') || '',
      email: url.searchParams.get('email') || '',
      mobileNumber: url.searchParams.get('mobileNumber') || '',
    },
  });
}

export async function action({ request }: Route.ActionArgs) {
  const { AppointmentSessionService } = await import('../../_services/appointment-session.service.server');
  const { ContactAuthService } = await import('../_services/contact-auth.service.server');
  const formData = await request.formData();
  const givenName = String(formData.get('givenName') || '');
  const familyName = String(formData.get('familyName') || '');
  const email = String(formData.get('email') || '');
  const password = String(formData.get('password') || '');
  const password2 = String(formData.get('password2') || '');
  const mobileNumber = String(formData.get('mobileNumber') || '');
  const redirectUrl = String(formData.get('redirectUrl') || '');
  const retryHref = buildSignUpRetryHref(request, { givenName, familyName, email, mobileNumber });

  try {
    const response = await ContactAuthService.signUp({
      givenName,
      familyName,
      email,
      password,
      password2,
      mobileNumber,
      redirectUrl,
    });

    const session = await AppointmentSessionService.get(request);
    if (!session) {
      return redirectWithError(
        request,
        ROUTES_MAP['booking.public.appointment.session'].href,
        '[sign-up] Kunne ikke hente session',
      );
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

    if (!response) {
      return redirectWithError(request, retryHref, 'Kunne ikke opprette konto. Prøv igjen.');
    }

    const setPendingUserResponse = await ContactAuthService.setPendingSessionUser(session.sessionId, response.userId);

    if (!setPendingUserResponse) {
      return redirectWithError(request, retryHref, 'Kunne ikke knytte brukeren til økten. Prøv igjen.');
    }
    const { verificationCookieHeader } = await ContactAuthService.resolvePostAuthRedirect(response);
    if (verificationCookieHeader) {
      headers.append('Set-Cookie', verificationCookieHeader);
    }

    const nextStepHref = resolveAuthNextStepHref(response.nextStep);
    if (nextStepHref) {
      return redirect(nextStepHref, { headers });
    }

    return redirectWithInfo(
      request,
      ROUTES_MAP['booking.public.appointment.session.contact'].href,
      'Kunne ikke opprette konto. Prøv igjen.',
      headers,
    );
  } catch (error) {
    const { message } = resolveErrorPayload(error, 'Kunne ikke opprette konto. Prøv igjen.');
    return redirectWithError(request, retryHref, message);
  }
}

export default function BookingPublicAppointmentSessionContactSignUpRoute({ loaderData }: Route.ComponentProps) {
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';

  return (
    <>
      <Stack space="xl">
        <PageHeader label="Kontakt" title="Opprett konto" description="Opprett en konto for å fortsette booking." />
        <div>
          <Link
            to={ROUTES_MAP['booking.public.appointment.session.contact'].href}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-text-secondary hover:text-text-primary"
          >
            <ChevronLeft className="size-4" />
            Tilbake til kontakt
          </Link>
        </div>

        <Panel title="Opprett konto" tone="muted">
          <Form method="post" aria-busy={isSubmitting}>
            <Stack space="md">
              <input type="hidden" name="redirectUrl" value="booking" />

              <div className="grid gap-4 md:grid-cols-2 md:gap-5">
                <Stack space="xs">
                  <Label htmlFor="givenName">Fornavn</Label>
                  <Input
                    id="givenName"
                    name="givenName"
                    autoComplete="given-name"
                    required
                    disabled={isSubmitting}
                    placeholder="Fornavn"
                    defaultValue={loaderData.defaults.givenName}
                  />
                </Stack>

                <Stack space="xs">
                  <Label htmlFor="familyName">Etternavn</Label>
                  <Input
                    id="familyName"
                    name="familyName"
                    autoComplete="family-name"
                    required
                    disabled={isSubmitting}
                    placeholder="Etternavn"
                    defaultValue={loaderData.defaults.familyName}
                  />
                </Stack>
              </div>

              <Stack space="xs">
                <Label htmlFor="email">E-post</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  required
                  disabled={isSubmitting}
                  placeholder="E-post"
                  defaultValue={loaderData.defaults.email}
                />
              </Stack>

              <Stack space="xs">
                <Label htmlFor="mobileNumber">Mobilnummer</Label>
                <Input
                  id="mobileNumber"
                  name="mobileNumber"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  required
                  disabled={isSubmitting}
                  placeholder="Mobilnummer"
                  defaultValue={loaderData.defaults.mobileNumber}
                />
              </Stack>

              <Stack space="xs">
                <Label htmlFor="password">Passord</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  disabled={isSubmitting}
                />
              </Stack>

              <Stack space="xs">
                <Label htmlFor="password2">Bekreft passord</Label>
                <Input
                  id="password2"
                  name="password2"
                  type="password"
                  autoComplete="new-password"
                  required
                  disabled={isSubmitting}
                />
              </Stack>

              <Button type="submit" size="lg" fullWidth className="gap-3">
                <UserPlus className="size-5" />
                Opprett konto
              </Button>
            </Stack>
          </Form>
        </Panel>
      </Stack>
    </>
  );
}
