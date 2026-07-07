import * as React from 'react';
import { Form, Link, data, redirect, useLocation, useNavigation } from 'react-router';
import { ChevronLeft, LogIn } from 'lucide-react';
import { resolveErrorPayload } from '~/lib/api-error';
import { redirectWithError, redirectWithInfo } from '~/lib/flash-message.server';
import { logger } from '~/lib/logger';
import { getBookingRouteMap } from '~/routes/booking/public/_utils/booking.route-map';
import { AppointmentSessionService } from '~/routes/booking/public/_services/booking.appointment-session.service.server';
import { accessTokenCookie, refreshTokenCookie } from '~/routes/auth/_features/auth.cookies.server';
import { ProviderButtons } from '~/routes/auth/_components/provider-buttons';
import { Button, Input, Label, PageHeader, Panel, Stack } from '~/ui';
import type { Route } from './+types/booking.public.appointment.session.contact.sign-in.route';
import { ContactAuthService } from '../_services/contact-auth.service.server';
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
  const emailOrMobile = url.searchParams.get('emailOrMobile') || '';

  return data({ session, emailOrMobile, contactHref: routes.contact });
}

export async function action({ request }: Route.ActionArgs) {
  const routes = getBookingRouteMap();
  logger.info('[sign-in] Action called', { request });

  const formData = await request.formData();
  const provider = String(formData.get('provider') || 'LOCAL');
  const idToken = String(formData.get('idToken') || '');
  const emailOrMobile = String(formData.get('emailOrMobile') || '');
  const password = String(formData.get('password') || '');
  const redirectUrl = String(formData.get('redirectUrl') || '');
  const isGoogleLogin = provider === 'GOOGLE';
  const retryHref = buildSignInRetryHref(request, emailOrMobile, provider);

  if (isGoogleLogin && !idToken) {
    return redirectWithError(request, retryHref, 'Kunne ikke logge inn med Google. Prøv igjen.');
  }

  try {
    const response = isGoogleLogin
      ? await ContactAuthService.signInWithProvider({
          provider: 'GOOGLE',
          idToken,
          redirectUrl,
        })
      : await ContactAuthService.signInLocal({
          emailOrMobile,
          password,
          redirectUrl,
        });

    if (response?.userId) {
      await ContactAuthService.attachUserToSession(request, response.userId);
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

    const { nextStepHref, verificationCookieHeader } = await ContactAuthService.resolvePostAuthRedirect(response);
    if (verificationCookieHeader) {
      headers.append('Set-Cookie', verificationCookieHeader);
    }

    if (nextStepHref) {
      return redirect(nextStepHref, { headers });
    }

    return redirectWithInfo(request, routes.contact, 'Kunne ikke logge inn. Prøv igjen.');
  } catch (error) {
    const { message, status } = resolveErrorPayload(error, 'Kunne ikke logge inn. Prøv igjen.');
    logger.warn('[sign-in] Login failed', { status: status ?? 400, message });
    return redirectWithError(request, retryHref, message);
  }
}

function buildSignInRetryHref(request: Request, emailOrMobile: string, provider: string): string {
  const currentUrl = new URL(request.url);
  const retryUrl = new URL(`${currentUrl.pathname}${currentUrl.search}`, currentUrl.origin);

  if (emailOrMobile) {
    retryUrl.searchParams.set('emailOrMobile', emailOrMobile);
  } else {
    retryUrl.searchParams.delete('emailOrMobile');
  }

  if (provider === 'GOOGLE') {
    retryUrl.searchParams.set('provider', provider);
  } else {
    retryUrl.searchParams.delete('provider');
  }

  return `${retryUrl.pathname}${retryUrl.search}`;
}

export default function BookingContactSignInPage({ loaderData }: Route.ComponentProps) {
  const navigation = useNavigation();
  const location = useLocation();
  const isSubmitting = navigation.state === 'submitting';
  const [emailOrMobile, setEmailOrMobile] = React.useState<string | null>(loaderData.emailOrMobile || null);
  const isGoogleProvider = React.useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get('provider') === 'GOOGLE';
  }, [location.search]);

  React.useEffect(() => {
    const params = new URLSearchParams(location.search);
    const emailOrMobileParam = params.get('emailOrMobile') || '';
    if (emailOrMobileParam) {
      setEmailOrMobile(emailOrMobileParam);
    }
  }, [location.search]);

  return (
    <Stack space="xl">
      <PageHeader
        label="Kontakt"
        title="Logg inn"
        description="Logg inn for å fortsette booking."
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

      <Panel title="Logg inn med e-post eller mobil" tone="muted" className={BOOKING_CONTACT_PANEL_CLASS}>
        <Form method="post" aria-busy={isSubmitting}>
          <Stack space="md">
            <ProviderButtons showDivider={!isGoogleProvider} />
            <input type="hidden" name="redirectUrl" value="booking" />

            {!isGoogleProvider ? (
              <>
                <Stack space="xs">
                  <Label htmlFor="emailOrMobile" className={BOOKING_CONTACT_LABEL_CLASS}>
                    E-post eller mobilnummer
                  </Label>
                  <Input
                    id="emailOrMobile"
                    name="emailOrMobile"
                    type="text"
                    inputMode="email"
                    autoComplete="username"
                    value={emailOrMobile || undefined}
                    onChange={(event) => setEmailOrMobile(event.target.value)}
                    disabled={isSubmitting}
                    variant="booking"
                  />
                </Stack>

                <Stack space="xs">
                  <Label htmlFor="password" className={BOOKING_CONTACT_LABEL_CLASS}>
                    Passord
                  </Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    disabled={isSubmitting}
                    variant="booking"
                  />
                </Stack>

                <Button
                  type="submit"
                  size="lg"
                  fullWidth
                  variant="booking-primary"
                  className="gap-3"
                  loading={isSubmitting}
                >
                  <LogIn className="size-5" />
                  Logg inn
                </Button>
              </>
            ) : null}
          </Stack>
        </Form>
      </Panel>
    </Stack>
  );
}
