import { useEffect, useMemo } from 'react';
import { data, redirect, useFetcher, Link, useNavigate } from 'react-router';
import type { Route } from './+types/booking.public.appointment.session.contact.route';
import { CheckCircle2, User } from 'lucide-react';

import type { UserDto } from '~/api/generated/identity';
import { AuthController, PublicUserController } from '~/api/generated/identity';
import type { PublicPendingUserResponseDto, PublicSessionRequirementsDto } from '~/api/generated/booking';
import { PublicAppointmentSessionController } from '~/api/generated/booking';
import { redirectWithError } from '~/routes/company/_lib/flash-message.server';
import {
  BookingButton,
  BookingContainer,
  BookingErrorBanner,
  BookingMeta,
  BookingSection,
  BookingStepHeader,
  BookingSummary,
} from '../../_components/booking-layout';
import { resolveErrorPayload } from '~/lib/api-error';
import { authService, AuthenticationError } from '~/lib/auth-service';
import { withAuth } from '~/api/utils/with-auth';
import { accessTokenCookie, refreshTokenCookie } from '~/routes/auth/_features/auth.cookies.server';
import { GoogleSignInButton } from '~/routes/auth/sign-in/_components/google-sign-in-button';
import { ENV } from '~/api/config/env';
import { getSession } from '~/lib/appointments.server';
import { ROUTES_MAP } from '~/lib/route-tree';

type NextStep = 'COLLECT_EMAIL' | 'COLLECT_MOBILE' | 'VERIFY_EMAIL' | 'VERIFY_MOBILE' | 'ATTACH_SESSION' | 'DONE';

type ActionPayload = {
  error?: string;
  nextStep?: NextStep;
  userId?: number;
  email?: string | null;
  mobileNumber?: string | null;
  emailSent?: boolean;
  mobileSent?: boolean;
  verificationSessionToken?: string;
  pendingCleared?: boolean;
  redirectTo?: string;
};

type LoaderData = {
  session: Awaited<ReturnType<typeof getSession>> | null;
  user: UserDto | null;
  authUser: { id: number; email?: string | null } | null;
  sessionUser: UserDto | null;
  requirements: PublicSessionRequirementsDto | null;
  pendingUser: PublicPendingUserResponseDto | null;
  hasMismatch: boolean;
};

const resolveNextStepCopy = (nextStep?: NextStep) => {
  if (nextStep === 'COLLECT_EMAIL') return 'Vi trenger en e-postadresse for å sende verifisering.';
  if (nextStep === 'COLLECT_MOBILE') return 'Vi trenger et mobilnummer for å kunne sende SMS-verifisering.';
  if (nextStep === 'VERIFY_EMAIL') return 'Sjekk e-posten din og bekreft kontoen før du fortsetter.';
  if (nextStep === 'VERIFY_MOBILE') return 'Sjekk SMS-en din og bekreft mobilnummeret før du fortsetter.';
  return null;
};

const resolveSignupStatusCopy = (emailSent?: boolean, mobileSent?: boolean) => {
  if (emailSent === false) return 'Vi klarte ikke å sende e-post. Prøv igjen senere eller kontakt support.';
  if (mobileSent === false) return 'Vi klarte ikke å sende SMS. Du kan fortsatt bekrefte e-posten.';
  return 'Vi har sendt verifisering til e-post og SMS.';
};

export async function loader({ request }: Route.LoaderArgs) {
  try {
    const session = await getSession(request);
    if (!session) {
      return redirectWithError(
        request,
        ROUTES_MAP['booking.public.appointment'].href,
        'Mangler aktiv bookingøkt. Start på nytt.',
      );
    }

    let authUser: { id: number; email?: string | null } | null = null;
    let accessToken: string | null = null;
    let user: UserDto | null = null;
    let sessionUser: UserDto | null = null;
    let requirements: PublicSessionRequirementsDto | null = null;
    let pendingUser: PublicPendingUserResponseDto | null = null;

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
              path: { userId: authUser.id },
            });
            return userResponse.data?.data ?? null;
          },
          accessToken,
        );
      } catch {
        user = null;
      }
    }

    if (session.userId) {
      try {
        sessionUser = accessToken
          ? await withAuth(
              request,
              async () => {
                const response = await PublicUserController.getUserById({
                  path: { userId: session.userId as number },
                });
                return response.data?.data ?? null;
              },
              accessToken,
            )
          : (await PublicUserController.getUserById({ path: { userId: session.userId } })).data?.data ?? null;
      } catch {
        sessionUser = null;
      }
    }

    try {
      requirements = accessToken
        ? await withAuth(
            request,
            async () => {
              const response = await PublicAppointmentSessionController.getAppointmentSessionRequirements({
                path: { sessionId: session.sessionId },
              });
              return response.data?.data ?? null;
            },
            accessToken,
          )
        : ((
            await PublicAppointmentSessionController.getAppointmentSessionRequirements({
              path: { sessionId: session.sessionId },
            })
          ).data?.data ?? null);
    } catch {
      requirements = null;
    }

    try {
      pendingUser =
        (
          await PublicAppointmentSessionController.getPendingAppointmentSessionUser({
            path: { sessionId: session.sessionId },
          })
        ).data?.data ?? null;
    } catch {
      pendingUser = null;
    }

    const hasMismatch = !!(session.userId && authUser && session.userId !== authUser.id);

    return data({
      session,
      user,
      authUser,
      sessionUser,
      requirements,
      pendingUser,
      hasMismatch,
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
    const intent = String(formData.get('intent') || '');
    const idToken = String(formData.get('idToken') || '');
    const isGoogleSignIn = Boolean(idToken);
    let accessToken: string | null = null;
    let userId: number | null = null;

    const attachSession = async (token: string, attachUserId: number) => {
      const attachResponse = await withAuth(
        request,
        () =>
          PublicAppointmentSessionController.attachAppointmentSessionUser({
            path: { sessionId: session.sessionId },
            query: { userId: attachUserId },
          }),
        token,
      );
      return attachResponse.data?.data ?? null;
    };

    const persistPendingUser = async (token: string, pendingUserId: number) => {
      const pendingResponse = await withAuth(
        request,
        () =>
          PublicAppointmentSessionController.setPendingAppointmentSessionUser({
            path: { sessionId: session.sessionId },
            body: { userId: pendingUserId },
          }),
        token,
      );
      return pendingResponse.data?.data ?? null;
    };

    if (intent === 'clear-pending-user') {
      await PublicAppointmentSessionController.clearPendingAppointmentSessionUser({
        path: { sessionId: session.sessionId },
      });
      return data({ pendingCleared: true }, { headers });
    }

    if (intent === 'resend-verification') {
      const email = String(formData.get('email') || '').trim();
      const verificationSessionToken = String(formData.get('verificationSessionToken') || '').trim();
      const resendNextStep = String(formData.get('nextStep') || '').trim() as NextStep | '';
      const resendResponse = await AuthController.resendVerification({
        body: {
          ...(email ? { email } : {}),
          ...(verificationSessionToken ? { verificationSessionToken } : {}),
        },
      });
      const resendPayload = resendResponse.data?.data;
      return data(
        {
          nextStep: resendNextStep || undefined,
          emailSent: resendPayload?.emailSent,
          mobileSent: resendPayload?.mobileSent,
          verificationSessionToken: verificationSessionToken || undefined,
          email: email || undefined,
        },
        { headers },
      );
    }

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
      userId = tokens.userId;

      const accessCookie = await accessTokenCookie.serialize(tokens.accessToken, {
        expires: new Date(tokens.accessTokenExpiresAt * 1000),
      });
      const refreshCookie = await refreshTokenCookie.serialize(tokens.refreshToken, {
        expires: new Date(tokens.refreshTokenExpiresAt * 1000),
      });
      headers.append('Set-Cookie', accessCookie);
      headers.append('Set-Cookie', refreshCookie);

      if (!tokens.nextStep || tokens.nextStep === 'ATTACH_SESSION' || tokens.nextStep === 'DONE') {
        if (!accessToken || !userId) {
          return data({ error: 'Kunne ikke bekrefte bruker.' }, { status: 400, headers });
        }
        await persistPendingUser(accessToken, userId);
        const attached = await attachSession(accessToken, userId);
        if (attached?.nextStep && attached.nextStep !== 'DONE') {
          return data({ nextStep: attached.nextStep, userId }, { headers });
        }
        const nextUrl = ROUTES_MAP['booking.public.appointment.session.employee'].href;
        return data({ redirectTo: nextUrl }, { headers });
      }

      if (accessToken && userId) {
        await persistPendingUser(accessToken, userId);
      }
      return data(
        {
          nextStep: tokens.nextStep,
          userId,
          email: tokens.email ?? null,
          mobileNumber: tokens.mobileNumber ?? null,
        },
        { headers },
      );
    }

    if (intent === 'local-sign-in') {
      const email = String(formData.get('email') || '').trim();
      const password = String(formData.get('password') || '');
      const signInResponse = await AuthController.signIn({
        body: {
          provider: 'LOCAL',
          email,
          password,
        },
      });
      const signInPayload = signInResponse.data?.data;
      if (!signInPayload) {
        const message = signInResponse.data?.message || 'Kunne ikke logge inn. Prøv igjen.';
        return data({ error: message }, { status: 400, headers });
      }

      accessToken = signInPayload.accessToken;
      userId = signInPayload.userId;

      const accessCookie = await accessTokenCookie.serialize(signInPayload.accessToken, {
        expires: new Date(signInPayload.accessTokenExpiresAt * 1000),
      });
      const refreshCookie = await refreshTokenCookie.serialize(signInPayload.refreshToken, {
        expires: new Date(signInPayload.refreshTokenExpiresAt * 1000),
      });
      headers.append('Set-Cookie', accessCookie);
      headers.append('Set-Cookie', refreshCookie);

      if (!signInPayload.nextStep || signInPayload.nextStep === 'ATTACH_SESSION' || signInPayload.nextStep === 'DONE') {
        if (!accessToken || !userId) {
          return data({ error: 'Kunne ikke bekrefte bruker.' }, { status: 400, headers });
        }
        await persistPendingUser(accessToken, userId);
        const attached = await attachSession(accessToken, userId);
        if (attached?.nextStep && attached.nextStep !== 'DONE') {
          return data({ nextStep: attached.nextStep, userId }, { headers });
        }
        const nextUrl = ROUTES_MAP['booking.public.appointment.session.employee'].href;
        return data({ redirectTo: nextUrl }, { headers });
      }

      await persistPendingUser(accessToken, userId);
      return data(
        {
          nextStep: signInPayload.nextStep,
          userId,
          email: signInPayload.email ?? null,
          mobileNumber: signInPayload.mobileNumber ?? null,
        },
        { headers },
      );
    }

    if (intent === 'provider-complete-profile') {
      const profileUserId = Number(formData.get('userId') || 0);
      const email = String(formData.get('email') || '').trim();
      const mobileNumber = String(formData.get('mobileNumber') || '').trim();

      try {
        const userSession = await authService.getUserSession(request);
        accessToken = userSession.accessToken;
      } catch (error) {
        if (error instanceof AuthenticationError) {
          return data({ error: 'Du må logge inn på nytt.' }, { status: 401, headers });
        }
        throw error;
      }

      const response = await withAuth(
        request,
        () =>
          AuthController.providerCompleteProfile({
            body: {
              userId: profileUserId,
              ...(email ? { email } : {}),
              ...(mobileNumber ? { mobileNumber } : {}),
            },
          }),
        accessToken,
      );
      const payload = response.data?.data;
      if (!payload) {
        const message = response.data?.message || 'Kunne ikke oppdatere profilen.';
        return data({ error: message }, { status: 400, headers });
      }

      if (payload.nextStep === 'ATTACH_SESSION') {
        await persistPendingUser(accessToken, profileUserId);
        const attached = await attachSession(accessToken, profileUserId);
        if (attached?.nextStep && attached.nextStep !== 'DONE') {
          return data({ nextStep: attached.nextStep, userId: profileUserId }, { headers });
        }
        const nextUrl = ROUTES_MAP['booking.public.appointment.session.employee'].href;
        return data({ redirectTo: nextUrl }, { headers });
      }

      await persistPendingUser(accessToken, profileUserId);
      return data(
        {
          nextStep: payload.nextStep,
          userId: payload.userId,
          email: payload.email ?? null,
          mobileNumber: payload.mobileNumber ?? null,
        },
        { headers },
      );
    }

    if (intent === 'signup') {
      const givenName = String(formData.get('givenName') || '').trim();
      const familyName = String(formData.get('familyName') || '').trim();
      const email = String(formData.get('email') || '').trim();
      const mobileNumber = String(formData.get('mobileNumber') || '').trim();
      const password = String(formData.get('password') || '');
      const password2 = String(formData.get('password2') || '');

      const response = await AuthController.signUp({
        body: {
          givenName,
          familyName,
          email,
          password,
          password2,
          mobileNumber,
        },
      });
      const payload = response.data?.data;
      if (!payload) {
        const message = response.data?.message || 'Kunne ikke opprette konto.';
        return data({ error: message }, { status: 400, headers });
      }

      if (payload.nextStep === 'SIGN_IN') {
        const signInResponse = await AuthController.signIn({
          body: {
            provider: 'LOCAL',
            email,
            password,
          },
        });
        const signInPayload = signInResponse.data?.data;
        if (!signInPayload) {
          const message = signInResponse.data?.message || 'Kunne ikke logge inn. Prøv igjen.';
          return data({ error: message }, { status: 400, headers });
        }

        accessToken = signInPayload.accessToken;
        userId = signInPayload.userId;

        const accessCookie = await accessTokenCookie.serialize(signInPayload.accessToken, {
          expires: new Date(signInPayload.accessTokenExpiresAt * 1000),
        });
        const refreshCookie = await refreshTokenCookie.serialize(signInPayload.refreshToken, {
          expires: new Date(signInPayload.refreshTokenExpiresAt * 1000),
        });
        headers.append('Set-Cookie', accessCookie);
        headers.append('Set-Cookie', refreshCookie);

        await persistPendingUser(accessToken, userId);
        const attached = await attachSession(accessToken, userId);
        if (attached?.nextStep && attached.nextStep !== 'DONE') {
          return data({ nextStep: attached.nextStep, userId }, { headers });
        }
        const nextUrl = ROUTES_MAP['booking.public.appointment.session.employee'].href;
        return data({ redirectTo: nextUrl }, { headers });
      }

      return data(
        {
          nextStep: payload.nextStep,
          emailSent: payload.emailSent,
          mobileSent: payload.mobileSent,
          verificationSessionToken: payload.verificationSessionToken,
          email,
        },
        { headers },
      );
    }

    const userSession = await authService.getUserSession(request);
    accessToken = userSession.accessToken;
    userId = userSession.user.id;

    if (!accessToken || !userId) {
      return data({ error: 'Kunne ikke bekrefte bruker.' }, { status: 400, headers });
    }

    const attached = await attachSession(accessToken, userId);
    if (attached?.nextStep && attached.nextStep !== 'DONE') {
      return data({ nextStep: attached.nextStep, userId }, { headers });
    }

    const nextUrl = ROUTES_MAP['booking.public.appointment.session.employee'].href;
    if (isGoogleSignIn) {
      return data({ redirectTo: nextUrl }, { headers });
    }
    return redirect(nextUrl, { headers });
  } catch (error) {
    const { message, status } = resolveErrorPayload(error, 'Kunne ikke lagre bruker');
    return data({ error: message }, { status: status ?? 400, headers });
  }
}

export default function AppointmentsContactForm({ loaderData, actionData }: Route.ComponentProps) {
  const fetcher = useFetcher({ key: 'appointment-user-auth-fetcher' });
  const navigate = useNavigate();
  const loader = (loaderData ?? {}) as Partial<LoaderData>;
  const session = loader.session ?? null;
  const user = loader.user ?? null;
  const authUser = loader.authUser ?? null;
  const sessionUser = loader.sessionUser ?? null;
  const requirements = loader.requirements ?? null;
  const pendingUser = loader.pendingUser ?? null;
  const hasMismatch = loader.hasMismatch ?? false;
  const actionPayload = useMemo<ActionPayload | undefined>(() => {
    if (fetcher.data) return fetcher.data as ActionPayload;
    if (actionData && typeof actionData === 'object') return actionData as ActionPayload;
    return undefined;
  }, [actionData, fetcher.data]);

  const actionError = actionPayload?.error;
  const signupStatusCopy = resolveSignupStatusCopy(actionPayload?.emailSent, actionPayload?.mobileSent);
  const error = actionError ?? (hasMismatch ? 'Du er logget inn som en annen bruker enn den som er valgt for denne bookingen.' : undefined);
  const isSubmitting = fetcher.state === 'submitting' || fetcher.state === 'loading';
  const googleClientId = ENV.GOOGLE_CLIENT_ID;
  const nextStep = actionPayload?.nextStep;
  const effectiveNextStep = nextStep ?? pendingUser?.nextStep ?? requirements?.nextStep;
  const verificationSessionToken = actionPayload?.verificationSessionToken;
  const nextStepCopy = resolveNextStepCopy(effectiveNextStep);
  const hasPendingUser = Boolean(pendingUser?.userId);
  const isAuthenticated = !!authUser && !hasMismatch;
  const hasSessionUser = Boolean(session?.userId);
  const canSubmit =
    isAuthenticated &&
    (!effectiveNextStep || effectiveNextStep === 'ATTACH_SESSION' || effectiveNextStep === 'DONE') &&
    (!requirements || requirements.nextStep === 'ATTACH_SESSION' || requirements.nextStep === 'DONE');

  useEffect(() => {
    const redirectTo = fetcher.data?.redirectTo;
    if (redirectTo) navigate(redirectTo);
  }, [fetcher.data, navigate]);

  if (!session) {
    return (
      <BookingContainer>
        <BookingSection label="Bruker" title="Logg inn for å fortsette">
          <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
            Ugyldig økt
          </div>
        </BookingSection>
      </BookingContainer>
    );
  }

  const handleGoogleCredential = (token: string) => {
    const formData = new FormData();
    formData.set('idToken', token);
    fetcher.submit(formData, { method: 'post' });
  };

  const sessionUserName = sessionUser
    ? `${sessionUser.givenName} ${sessionUser.familyName}`
    : session?.userId
      ? `Bruker #${session.userId}`
      : 'Ukjent bruker';

  const displayName =
    user?.givenName && user?.familyName ? `${user.givenName} ${user.familyName}` : authUser?.email ?? 'Innlogget bruker';

  return (
    <>
      <BookingContainer>
        {error && <BookingErrorBanner message={error} sticky />}

        <BookingStepHeader label="Bruker" title="Logg inn for å fortsette" className="mb-4 md:mb-6" />

        <BookingSection className="space-y-4 md:space-y-6">
          {hasPendingUser ? (
            <div className="space-y-4">
              <div className="rounded-lg border border-card-border bg-card p-4 md:p-6">
                <p className="text-sm font-semibold text-card-text">Bruker under behandling</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Vi har lagret brukeren i bookingen. Fullfør steget under for å fortsette.
                </p>
                <div className="mt-3 rounded-md border border-card-border bg-card-muted-bg p-3 text-xs text-muted-foreground">
                  <p className="font-medium text-card-text">Neste steg</p>
                  <p className="mt-1">{nextStepCopy ?? 'Fortsett når verifiseringen er klar.'}</p>
                </div>

                {effectiveNextStep === 'COLLECT_EMAIL' || effectiveNextStep === 'COLLECT_MOBILE' ? (
                  <fetcher.Form method="post" className="mt-3 space-y-3">
                    <input type="hidden" name="intent" value="provider-complete-profile" />
                    <input type="hidden" name="userId" value={pendingUser?.userId ?? ''} />
                    {effectiveNextStep === 'COLLECT_EMAIL' ? (
                      <label className="space-y-1 text-xs font-medium text-muted-foreground">
                        E-post
                        <input
                          name="email"
                          type="email"
                          autoComplete="email"
                          className="h-11 w-full rounded-md border border-form-border bg-form-bg px-3 text-sm text-card-text"
                          required
                        />
                      </label>
                    ) : null}
                    {effectiveNextStep === 'COLLECT_MOBILE' ? (
                      <label className="space-y-1 text-xs font-medium text-muted-foreground">
                        Mobilnummer
                        <input
                          name="mobileNumber"
                          type="tel"
                          autoComplete="tel"
                          className="h-11 w-full rounded-md border border-form-border bg-form-bg px-3 text-sm text-card-text"
                          required
                        />
                      </label>
                    ) : null}
                    <BookingButton type="submit" variant="secondary" size="md" disabled={isSubmitting}>
                      Lagre og fortsett
                    </BookingButton>
                  </fetcher.Form>
                ) : null}

                {effectiveNextStep === 'VERIFY_EMAIL' || effectiveNextStep === 'VERIFY_MOBILE' ? (
                  <fetcher.Form method="post" className="mt-3">
                    <input type="hidden" name="intent" value="resend-verification" />
                    <input type="hidden" name="email" value={user?.email ?? authUser?.email ?? ''} />
                    <input type="hidden" name="nextStep" value={effectiveNextStep ?? ''} />
                    {verificationSessionToken ? (
                      <input type="hidden" name="verificationSessionToken" value={verificationSessionToken} />
                    ) : null}
                    <BookingButton type="submit" variant="outline" size="md" disabled={isSubmitting}>
                      Send verifisering på nytt
                    </BookingButton>
                  </fetcher.Form>
                ) : null}
              </div>

              <fetcher.Form method="post">
                <input type="hidden" name="intent" value="clear-pending-user" />
                <BookingButton type="submit" variant="destructive" size="md" disabled={isSubmitting}>
                  Start på nytt
                </BookingButton>
              </fetcher.Form>
            </div>
          ) : isAuthenticated ? (
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
                    { label: 'Navn', value: displayName },
                    ...(user?.email ? [{ label: 'E-post', value: user.email }] : []),
                  ]}
                />
              </div>

              <fetcher.Form method="post" className="hidden md:block">
                <input type="hidden" name="intent" value="attach-session" />
                <BookingButton type="submit" variant="primary" size="lg" disabled={!canSubmit} loading={isSubmitting}>
                  Fortsett
                </BookingButton>
              </fetcher.Form>
            </div>
          ) : (
            <div className="space-y-4">
              {hasSessionUser ? (
                <div className="rounded-lg border border-card-border bg-card p-4 md:p-6">
                  <p className="text-sm font-semibold text-card-text">Bruker i bookingen</p>
                  <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                    <p>Navn: {sessionUserName}</p>
                    {sessionUser?.email ? <p>E-post: {sessionUser.email}</p> : null}
                    {sessionUser?.mobileNumber ? <p>Mobil: {sessionUser.mobileNumber}</p> : null}
                  </div>
                </div>
              ) : null}

              <div className="space-y-4 rounded-lg border border-card-border bg-card-muted-bg p-4 md:p-6">
                <div className="flex items-center gap-3">
                  <User className="size-4 text-muted-foreground md:size-5" />
                  <div>
                    <p className="text-sm font-semibold text-card-text">Logg inn for å fortsette</p>
                    <p className="text-xs text-muted-foreground">
                      Du kan logge inn med brukeren i bookingen eller opprette en ny.
                    </p>
                  </div>
                </div>

                <fetcher.Form method="post" className="space-y-3">
                  <input type="hidden" name="intent" value="local-sign-in" />
                  <label className="space-y-1 text-xs font-medium text-muted-foreground">
                    E-post
                    <input
                      name="email"
                      type="email"
                      autoComplete="email"
                      className="h-11 w-full rounded-md border border-form-border bg-form-bg px-3 text-sm text-card-text"
                      required
                    />
                  </label>
                  <label className="space-y-1 text-xs font-medium text-muted-foreground">
                    Passord
                    <input
                      name="password"
                      type="password"
                      autoComplete="current-password"
                      className="h-11 w-full rounded-md border border-form-border bg-form-bg px-3 text-sm text-card-text"
                      required
                    />
                  </label>
                  <BookingButton type="submit" variant="secondary" size="md" fullWidth disabled={isSubmitting}>
                    Logg inn
                  </BookingButton>
                </fetcher.Form>

                {googleClientId ? (
                  <GoogleSignInButton onCredential={handleGoogleCredential} disabled={isSubmitting} />
                ) : (
                  <p className="text-sm text-muted-foreground">Google-innlogging er ikke tilgjengelig akkurat nå.</p>
                )}
              </div>

              <details className="rounded-lg border border-card-border bg-card p-4 md:p-6">
                <summary className="cursor-pointer text-sm font-semibold text-card-text">Opprett en annen bruker</summary>
                <div className="mt-4 space-y-4">
                  <fetcher.Form method="post" className="space-y-4">
                    <input type="hidden" name="intent" value="signup" />
                    <div className="grid gap-4 md:grid-cols-2">
                      <label className="space-y-1 text-sm font-medium text-card-text">
                        Fornavn
                        <input
                          name="givenName"
                          autoComplete="given-name"
                          className="h-11 w-full rounded-md border border-form-border bg-form-bg px-3 text-sm"
                          required
                        />
                      </label>
                      <label className="space-y-1 text-sm font-medium text-card-text">
                        Etternavn
                        <input
                          name="familyName"
                          autoComplete="family-name"
                          className="h-11 w-full rounded-md border border-form-border bg-form-bg px-3 text-sm"
                          required
                        />
                      </label>
                    </div>
                    <label className="space-y-1 text-sm font-medium text-card-text">
                      E-post
                      <input
                        name="email"
                        type="email"
                        autoComplete="email"
                        className="h-11 w-full rounded-md border border-form-border bg-form-bg px-3 text-sm"
                        required
                      />
                    </label>
                    <label className="space-y-1 text-sm font-medium text-card-text">
                      Mobilnummer
                      <input
                        name="mobileNumber"
                        type="tel"
                        autoComplete="tel"
                        className="h-11 w-full rounded-md border border-form-border bg-form-bg px-3 text-sm"
                        required
                      />
                    </label>
                    <label className="space-y-1 text-sm font-medium text-card-text">
                      Passord
                      <input
                        name="password"
                        type="password"
                        autoComplete="new-password"
                        className="h-11 w-full rounded-md border border-form-border bg-form-bg px-3 text-sm"
                        required
                      />
                    </label>
                    <label className="space-y-1 text-sm font-medium text-card-text">
                      Bekreft passord
                      <input
                        name="password2"
                        type="password"
                        autoComplete="new-password"
                        className="h-11 w-full rounded-md border border-form-border bg-form-bg px-3 text-sm"
                        required
                      />
                    </label>
                    <BookingButton type="submit" variant="secondary" size="md" fullWidth disabled={isSubmitting}>
                      Opprett bruker
                    </BookingButton>
                  </fetcher.Form>

                  {effectiveNextStep ? (
                    <div className="rounded-lg border border-card-border bg-card-muted-bg p-3 text-xs text-muted-foreground md:text-sm">
                      <p className="font-medium text-card-text">Neste steg</p>
                      <p className="mt-1">{nextStepCopy ?? 'Fortsett når verifiseringen er klar.'}</p>
                      {actionPayload?.nextStep ? <p className="mt-2">{signupStatusCopy}</p> : null}
                    </div>
                  ) : null}
                  {actionPayload?.nextStep === 'VERIFY_EMAIL' || actionPayload?.nextStep === 'VERIFY_MOBILE' ? (
                    <fetcher.Form method="post" className="mt-3">
                      <input type="hidden" name="intent" value="resend-verification" />
                      <input type="hidden" name="nextStep" value={actionPayload.nextStep} />
                      <input type="hidden" name="email" value={actionPayload.email ?? ''} />
                      {verificationSessionToken ? (
                        <input type="hidden" name="verificationSessionToken" value={verificationSessionToken} />
                      ) : null}
                      <BookingButton type="submit" variant="outline" size="md" disabled={isSubmitting}>
                        Send verifisering på nytt
                      </BookingButton>
                    </fetcher.Form>
                  ) : null}
                </div>
              </details>
            </div>
          )}
        </BookingSection>
      </BookingContainer>

      <BookingSummary
        mobile={{
          items: [],
          primaryAction: (
            <fetcher.Form method="post">
              <input type="hidden" name="intent" value="attach-session" />
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
            </fetcher.Form>
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
