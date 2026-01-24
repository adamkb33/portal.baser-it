import { useEffect } from 'react';
import { data, redirect, useFetcher, Form, Link, useNavigate } from 'react-router';
import type { Route } from './+types/booking.public.appointment.session.contact.route';
import { CheckCircle2, User } from 'lucide-react';
import type { UserDto } from '~/api/generated/identity';
import { getSession } from '~/lib/appointments.server';
import { ROUTES_MAP } from '~/lib/route-tree';
import { AuthController, PublicUserController } from '~/api/generated/identity';
import { PublicAppointmentSessionController } from '~/api/generated/booking';
import { redirectWithError } from '~/routes/company/_lib/flash-message.server';
import {
  BookingContainer,
  BookingSection,
  BookingButton,
  BookingMeta,
  BookingErrorBanner,
  BookingStepHeader,
  BookingSummary,
} from '../../_components/booking-layout';
import { resolveErrorPayload } from '~/lib/api-error';
import { authService, AuthenticationError } from '~/lib/auth-service';
import { withAuth } from '~/api/utils/with-auth';
import { accessTokenCookie, refreshTokenCookie } from '~/routes/auth/_features/auth.cookies.server';
import { GoogleSignInButton } from '~/routes/auth/sign-in/_components/google-sign-in-button';
import { ENV } from '~/api/config/env';

const getErrorMessageId = (error: unknown) => {
  const responseError = error as { response?: { data?: { message?: { id?: string } } } };
  return responseError?.response?.data?.message?.id;
};

export async function loader({ request }: Route.LoaderArgs) {
  console.debug('[booking.user.loader] start', {
    method: request.method,
    url: request.url,
    referer: request.headers.get('referer'),
    userAgent: request.headers.get('user-agent'),
  });
  try {
    const session = await getSession(request);

    if (!session) {
      console.error('[booking.user.loader] missing session');
      return redirectWithError(
        request,
        ROUTES_MAP['booking.public.appointment'].href,
        'Mangler aktiv bookingøkt. Start på nytt.',
      );
    }

    let authUser: { id: number; email: string } | null = null;
    let accessToken: string | null = null;
    let user: UserDto | null = null;
    let error: string | null = null;

    try {
      const userSession = await authService.getUserSession(request);
      authUser = userSession.user;
      accessToken = userSession.accessToken;
    } catch (error) {
      if (!(error instanceof AuthenticationError)) {
        throw error;
      }
    }

    if (authUser && accessToken) {
      try {
        user = await withAuth(
          request,
          async () => {
            const userResponse = await PublicUserController.getUserById({
              path: {
                userId: authUser.id,
              },
            });
            return userResponse.data?.data ?? null;
          },
          accessToken,
        );
      } catch (error) {
        console.warn('[booking.user.loader] failed to load user profile', {
          message: error instanceof Error ? error.message : String(error),
          userId: authUser.id,
        });
      }
    }

    if (session.userId && !authUser) {
      error = 'Logg inn for å fortsette bookingen.';
    }

    if (session.userId && authUser && session.userId !== authUser.id) {
      error = 'Du er logget inn som en annen bruker enn den som er valgt for denne bookingen.';
    }

    console.debug('[booking.user.loader] loaded', {
      sessionId: session.sessionId,
      companyId: session.companyId,
      hasUserId: !!session.userId,
      hasAuthUser: !!authUser,
    });
    return data({
      session,
      user,
      authUser,
      error,
    });
  } catch (error) {
    const { message } = resolveErrorPayload(error, 'Kunne ikke hente brukerdata.');
    return redirectWithError(request, ROUTES_MAP['booking.public.appointment'].href, message);
  }
}

export async function action({ request }: Route.ActionArgs) {
  const headers = new Headers();
  try {
    const session = await getSession(request);

    if (!session) {
      return redirectWithError(
        request,
        ROUTES_MAP['booking.public.appointment'].href,
        'Mangler aktiv bookingøkt. Start på nytt.',
      );
    }

    const formData = await request.formData();
    const idToken = String(formData.get('idToken') || '');
    const isGoogleSignIn = Boolean(idToken);
    let accessToken: string | null = null;
    let userId: number | null = null;

    if (idToken) {
      const signInResponse = await AuthController.signIn({
        body: {
          provider: 'GOOGLE',
          idToken,
        },
      });
      const tokens = signInResponse.data?.data;
      if (!tokens) {
        const message = signInResponse.data?.message || 'Kunne ikke logge inn med Google.';
        return data({ error: message }, { status: 400, headers });
      }

      accessToken = tokens.accessToken;
      const authPayload = authService.verifyAndDecodeToken(tokens.accessToken);
      userId = authPayload.id;

      const accessCookie = await accessTokenCookie.serialize(tokens.accessToken, {
        expires: new Date(tokens.accessTokenExpiresAt * 1000),
      });
      const refreshCookie = await refreshTokenCookie.serialize(tokens.refreshToken, {
        expires: new Date(tokens.refreshTokenExpiresAt * 1000),
      });
      headers.append('Set-Cookie', accessCookie);
      headers.append('Set-Cookie', refreshCookie);
    } else {
      try {
        const userSession = await authService.getUserSession(request);
        accessToken = userSession.accessToken;
        userId = userSession.user.id;
      } catch (error) {
        if (error instanceof AuthenticationError) {
          return data({ error: 'Logg inn med Google for å fortsette.' }, { status: 401, headers });
        }
        throw error;
      }
    }

    if (!accessToken || !userId) {
      return data({ error: 'Kunne ikke bekrefte bruker.' }, { status: 400, headers });
    }

    await withAuth(
      request,
      () =>
        PublicAppointmentSessionController.submitAppointmentSessionUser({
          query: {
            sessionId: session.sessionId,
            userId,
          },
        }),
      accessToken,
    );

    const nextUrl = ROUTES_MAP['booking.public.appointment.session.employee'].href;
    if (isGoogleSignIn) {
      return data({ redirectTo: nextUrl }, { headers });
    }
    return redirect(nextUrl, { headers });
  } catch (error) {
    const errorId = getErrorMessageId(error);
    if (errorId === 'INVALID_USER_ID' || errorId === 'NOT_FOUND' || errorId === 'USER_NOT_FOUND') {
      return data({ error: 'Bruker mangler. Logg inn på nytt.' }, { status: 400, headers });
    }
    const { message, status } = resolveErrorPayload(error, 'Kunne ikke lagre bruker');
    return data({ error: message }, { status: status ?? 400, headers });
  }
}

export default function AppointmentsContactForm({ loaderData, actionData }: Route.ComponentProps) {
  const fetcher = useFetcher({ key: 'appointment-user-auth-fetcher' });
  const navigate = useNavigate();
  const session = loaderData.session ?? null;
  const user = loaderData.user ?? null;
  const authUser = loaderData.authUser ?? null;
  const actionError =
    fetcher.data?.error ?? (actionData && 'error' in actionData ? actionData.error : undefined);
  const loaderError = loaderData.error ?? undefined;
  const error = loaderError || actionError;
  const isAuthenticated = !!authUser;
  const isSubmitting = fetcher.state === 'submitting' || fetcher.state === 'loading';
  const googleClientId = ENV.GOOGLE_CLIENT_ID;
  const canSubmit = isAuthenticated && (!session?.userId || session.userId === authUser?.id);

  useEffect(() => {
    const redirectTo = fetcher.data?.redirectTo;
    if (redirectTo) {
      navigate(redirectTo);
    }
  }, [fetcher.data, navigate]);

  if (loaderError || !session) {
    return (
      <BookingContainer>
        <BookingSection label="Bruker" title="Logg inn for å fortsette">
          <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
            {loaderError ?? 'Ugyldig økt'}
          </div>
        </BookingSection>
      </BookingContainer>
    );
  }

  const handleGoogleCredential = (token: string) => {
    const formData = new FormData();
    formData.set('idToken', token);
    fetcher.submit(formData, {
      method: 'post',
    });
  };

  const displayName =
    user?.givenName && user?.familyName
      ? `${user.givenName} ${user.familyName}`
      : authUser?.email
        ? authUser.email
        : 'Innlogget bruker';

  return (
    <>
      <BookingContainer>
        {error && <BookingErrorBanner message={error} sticky />}

        <BookingStepHeader
          label="Bruker"
          title="Logg inn for å fortsette"
          className="mb-4 md:mb-6"
        />

        <BookingSection className="space-y-4 md:space-y-6">
          {isAuthenticated ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="size-4 text-secondary md:size-5" />
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground md:text-sm">
                  Innlogget bruker
                </span>
              </div>

              <div className="rounded-lg border border-card-border bg-card-muted-bg p-3 md:p-4">
                <BookingMeta
                  layout="compact"
                  className="space-y-2 md:space-y-2.5"
                  items={[
                    {
                      label: 'Navn',
                      value: displayName,
                    },
                    ...(user?.email
                      ? [
                          {
                            label: 'E-post',
                            value: user.email,
                          },
                        ]
                      : []),
                  ]}
                />
              </div>

              <Form method="post" className="hidden md:block">
                <BookingButton type="submit" variant="primary" size="lg" disabled={!canSubmit} loading={isSubmitting}>
                  Fortsett
                </BookingButton>
              </Form>
            </div>
          ) : (
            <div className="space-y-4 rounded-lg border border-card-border bg-card-muted-bg p-4 md:p-6">
              <div className="flex items-center gap-3">
                <User className="size-4 text-muted-foreground md:size-5" />
                <div>
                  <p className="text-sm font-semibold text-card-text">Logg inn for å fortsette</p>
                  <p className="text-xs text-muted-foreground">
                    Vi trenger en bruker før vi kan knytte bookingen til en avtale.
                  </p>
                </div>
              </div>

              {googleClientId ? (
                <GoogleSignInButton onCredential={handleGoogleCredential} disabled={isSubmitting} />
              ) : (
                <p className="text-sm text-muted-foreground">
                  Google-innlogging er ikke tilgjengelig akkurat nå.
                </p>
              )}
            </div>
          )}
        </BookingSection>
      </BookingContainer>

      <BookingSummary
        mobile={{
          items: [],
          primaryAction: (
            <Form method="post">
              <BookingButton
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                disabled={!canSubmit || isSubmitting}
                loading={isSubmitting}
              >
                Fortsett
              </BookingButton>
            </Form>
          ),
          secondaryAction: (
            <Link to={ROUTES_MAP['booking.public.appointment'].href}>
              <BookingButton type="button" variant="outline" size="md" fullWidth>
                Tilbake
              </BookingButton>
            </Link>
          ),
        }}
      />
    </>
  );
}
