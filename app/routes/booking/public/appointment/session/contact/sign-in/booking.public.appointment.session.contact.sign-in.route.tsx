import * as React from 'react';
import { data, Form, useNavigation, useLocation, redirect, Link } from 'react-router';
import type { Route } from './+types/booking.public.appointment.session.contact.sign-in.route';
import { ROUTES_MAP } from '~/lib/route-tree';
import { ProviderButtons } from '~/routes/auth/_components/provider-buttons';
import { ChevronLeft, LogIn } from 'lucide-react';
import { redirectWithError, redirectWithInfo } from '~/lib/flash-message.server';
import { resolveErrorPayload } from '~/lib/api-error';
import { logger } from '~/lib/logger';
import { accessTokenCookie, refreshTokenCookie } from '~/routes/auth/_features/auth.cookies.server';
import { ContactAuthService } from '../_services/contact-auth.service.server';
import { Button, Input, Label, PageHeader, Panel, Stack } from '~/ui';

function buildSignInRetryHref(request: Request, email: string, provider: string): string {
  const currentUrl = new URL(request.url);
  const retryUrl = new URL(`${currentUrl.pathname}${currentUrl.search}`, currentUrl.origin);

  if (email) {
    retryUrl.searchParams.set('email', email);
  } else {
    retryUrl.searchParams.delete('email');
  }

  if (provider === 'GOOGLE') {
    retryUrl.searchParams.set('provider', provider);
  } else {
    retryUrl.searchParams.delete('provider');
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
  const email = url.searchParams.get('email') || '';

  return data({ session, email });
}

export async function action({ request }: Route.ActionArgs) {
  logger.info('[sign-in] Action called', { request });

  const formData = await request.formData();
  const provider = String(formData.get('provider') || 'LOCAL');
  const idToken = String(formData.get('idToken') || '');
  const email = String(formData.get('email') || '');
  const password = String(formData.get('password') || '');
  const redirectUrl = String(formData.get('redirectUrl') || '');
  const isGoogleLogin = provider === 'GOOGLE';
  const retryHref = buildSignInRetryHref(request, email, provider);

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
          emailOrMobile: email,
          password,
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
  } catch (error) {
    const { message, status } = resolveErrorPayload(error, 'Kunne ikke logge inn. Prøv igjen.');
    logger.warn('[sign-in] Login failed', { status: status ?? 400, message });
    return redirectWithError(request, retryHref, message);
  }
}

export default function BookingPublicAppointmentSessionContactSignInRoute({ loaderData }: Route.ComponentProps) {
  const navigation = useNavigation();
  const location = useLocation();
  const isSubmitting = navigation.state === 'submitting';
  const [email, setEmail] = React.useState<string | null>(loaderData.email || null);
  const isGoogleProvider = React.useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get('provider') === 'GOOGLE';
  }, [location.search]);

  React.useEffect(() => {
    const params = new URLSearchParams(location.search);
    const emailParam = params.get('email') || '';
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [location.search]);

  return (
    <>
      <Stack space="xl">
        <PageHeader label="Kontakt" title="Logg inn" description="Logg inn for å fortsette booking." />
        <div>
          <Link
            to={ROUTES_MAP['booking.public.appointment.session.contact'].href}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-text-secondary hover:text-text-primary"
          >
            <ChevronLeft className="size-4" />
            Tilbake til kontakt
          </Link>
        </div>

        <Panel title="Logg inn med e-post" tone="muted">
          <Form method="post" aria-busy={isSubmitting}>
            <Stack space="md">
              <ProviderButtons showDivider={!isGoogleProvider} />
              <input type="hidden" name="redirectUrl" value="booking" />

              {!isGoogleProvider ? (
                <>
                  <Stack space="xs">
                    <Label htmlFor="email">E-post</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      value={email || undefined}
                      onChange={(event) => setEmail(event.target.value)}
                      disabled={isSubmitting}
                    />
                  </Stack>

                  <Stack space="xs">
                    <Label htmlFor="password">Passord</Label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      autoComplete="current-password"
                      disabled={isSubmitting}
                    />
                  </Stack>

                  <Button type="submit" size="lg" fullWidth className="gap-3">
                    <LogIn className="size-5" />
                    Logg inn
                  </Button>
                </>
              ) : null}
            </Stack>
          </Form>
        </Panel>
      </Stack>
    </>
  );
}
