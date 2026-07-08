import { Form, Link, data, redirect, useNavigation } from 'react-router';
import { ChevronLeft, UserPlus } from 'lucide-react';
import { resolveErrorPayload } from '~/lib/api-error';
import { redirectWithError, redirectWithInfo } from '~/lib/flash-message.server';
import { getBookingRouteMap } from '~/routes/booking/public/_utils/booking.route-map';
import { AppointmentSessionService } from '~/routes/booking/public/_services/booking.appointment-session.service.server';
import { accessTokenCookie, refreshTokenCookie } from '~/routes/auth/_features/auth.cookies.server';
import { Button, Input, Label, PageHeader, Panel, Stack, Text } from '~/ui';
import type { Route } from './+types/booking.public.appointment.session.contact.sign-up.route';
import { ContactAuthService } from '../_services/contact-auth.service.server';
import { resolveAuthNextStepHref } from '../_utils/auth.utils';
import {
  BOOKING_CONTACT_LABEL_CLASS,
  BOOKING_CONTACT_PAGE_HEADER_CLASS,
  BOOKING_CONTACT_PANEL_CLASS,
} from '../_utils/booking-contact-theme';

export async function loader({ request }: Route.LoaderArgs) {
  const routes = getBookingRouteMap();
  const session = await AppointmentSessionService.get(request);

  if (!session) {
    return redirectWithError(request, routes.session, 'Kunne ikke hente session');
  }

  const url = new URL(request.url);
  return data({
    session,
    contactHref: routes.contact,
    defaults: {
      givenName: url.searchParams.get('givenName') || '',
      familyName: url.searchParams.get('familyName') || '',
      email: url.searchParams.get('email') || '',
      mobileNumber: url.searchParams.get('mobileNumber') || '',
    },
  });
}

export async function action({ request }: Route.ActionArgs) {
  const routes = getBookingRouteMap();
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
    if (!mobileNumber.trim()) {
      return redirectWithError(request, retryHref, 'Mobilnummer er påkrevd for å bestille time.');
    }

    const response = await ContactAuthService.signUp({
      givenName,
      familyName,
      email: email.trim(),
      password,
      password2,
      mobileNumber: mobileNumber.trim(),
      redirectUrl,
    });

    const session = await AppointmentSessionService.get(request);
    if (!session) {
      return redirectWithError(request, routes.session, '[sign-up] Kunne ikke hente session');
    }

    const headers = new Headers();
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

    const nextStepHref = resolveAuthNextStepHref(response.nextStep, {
      emailDelivery: response.emailDelivery,
      mobileDelivery: response.mobileDelivery,
    });
    if (nextStepHref) {
      return redirect(nextStepHref, { headers });
    }

    return redirectWithInfo(request, routes.contact, 'Kunne ikke opprette konto. Prøv igjen.', headers);
  } catch (error) {
    const { message } = resolveErrorPayload(error, 'Kunne ikke opprette konto. Prøv igjen.');
    return redirectWithError(request, retryHref, message);
  }
}

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

export default function BookingContactSignUpPage({ loaderData }: Route.ComponentProps) {
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';

  return (
    <Stack space="xl">
      <PageHeader
        label="Kontakt"
        title="Opprett konto"
        description="Opprett en konto for å fortsette booking."
        className={BOOKING_CONTACT_PAGE_HEADER_CLASS}
      />
      <div>
        <Link
          to={loaderData.contactHref}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-booking-text-muted hover:text-booking-text"
        >
          <ChevronLeft className="size-4" />
          Tilbake til kontakt
        </Link>
      </div>

      <Panel title="Opprett konto" tone="muted" className={BOOKING_CONTACT_PANEL_CLASS}>
        <Form method="post" aria-busy={isSubmitting}>
          <Stack space="md">
            <input type="hidden" name="redirectUrl" value="booking" />

            <div className="grid gap-4 md:grid-cols-2 md:gap-5">
              <Stack space="xs">
                <Label htmlFor="givenName" className={BOOKING_CONTACT_LABEL_CLASS}>
                  Fornavn
                </Label>
                <Input
                  id="givenName"
                  name="givenName"
                  autoComplete="given-name"
                  required
                  disabled={isSubmitting}
                  placeholder="Fornavn"
                  defaultValue={loaderData.defaults.givenName}
                  variant="booking"
                />
              </Stack>

              <Stack space="xs">
                <Label htmlFor="familyName" className={BOOKING_CONTACT_LABEL_CLASS}>
                  Etternavn
                </Label>
                <Input
                  id="familyName"
                  name="familyName"
                  autoComplete="family-name"
                  required
                  disabled={isSubmitting}
                  placeholder="Etternavn"
                  defaultValue={loaderData.defaults.familyName}
                  variant="booking"
                />
              </Stack>
            </div>

            <Stack space="xs">
              <Label htmlFor="email" className={BOOKING_CONTACT_LABEL_CLASS}>
                E-post
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                disabled={isSubmitting}
                placeholder="E-post"
                defaultValue={loaderData.defaults.email}
                variant="booking"
              />
              <Text as="p" variant="caption" className="text-booking-text-muted">
                Valgfritt. Legg inn e-post hvis du også vil motta bekreftelse på e-post.
              </Text>
            </Stack>

            <Stack space="xs">
              <Label htmlFor="mobileNumber" className={BOOKING_CONTACT_LABEL_CLASS}>
                Mobilnummer
              </Label>
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
                variant="booking"
              />
              <Text as="p" variant="caption" className="text-booking-text-muted">
                Vi bruker mobilnummeret ditt til å bekrefte bestillingen og sende viktig informasjon om timen.
              </Text>
            </Stack>

            <Stack space="xs">
              <Label htmlFor="password" className={BOOKING_CONTACT_LABEL_CLASS}>
                Passord
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                disabled={isSubmitting}
                variant="booking"
              />
            </Stack>

            <Stack space="xs">
              <Label htmlFor="password2" className={BOOKING_CONTACT_LABEL_CLASS}>
                Bekreft passord
              </Label>
              <Input
                id="password2"
                name="password2"
                type="password"
                autoComplete="new-password"
                required
                disabled={isSubmitting}
                variant="booking"
              />
            </Stack>

            <Button type="submit" size="lg" fullWidth variant="booking-primary" className="gap-3" loading={isSubmitting}>
              <UserPlus className="size-5" />
              {isSubmitting ? 'Oppretter konto...' : 'Opprett konto'}
            </Button>
          </Stack>
        </Form>
      </Panel>
    </Stack>
  );
}
