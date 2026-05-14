import { data, useFetcher, redirect, useNavigate } from 'react-router';
import type { Route } from './+types/booking.public.appointment.session.contact.verify-mobile.route';
import { API_ROUTES_MAP, ROUTES_MAP } from '~/lib/route-tree';
import { resolveErrorPayload } from '~/lib/api-error';
import type { action as resendVerificationMobileAction } from '~/routes/api/auth/resend-verification/mobile/auth.resend-verification.mobile.api-route';
import type { action as verifyMobileAction } from '~/routes/api/auth/verify-mobile/auth.verify-mobile.api-route';
import type { loader as userStatusLoader } from '~/routes/api/auth/user-status/auth.user-status.api-route';
import { redirectAuthStatusNextStepHref, resolveAuthNextStepHref } from '../_utils/auth.utils';
import React from 'react';
import { redirectWithError } from '~/lib/flash-message.server';
import { Button, Notice, PageHeader, Panel, Stack, VerificationCodeInput } from '~/ui';

const CODE_LENGTH = 6;

export async function loader({ request }: Route.LoaderArgs) {
  try {
    const { AppointmentSessionService } = await import('../../_services/appointment-session.service.server');
    const { ContactAuthService } = await import('../_services/contact-auth.service.server');
    const { VerificationTokenService } = await import('../_services/verification-token.service.server');
    const session = await AppointmentSessionService.get(request);

    if (!session || !session.userId) {
      console.info('[verify-mobile] redirect: missing session or userId', {
        hasSession: Boolean(session),
        userId: session?.userId ?? null,
      });
      return redirect(ROUTES_MAP['booking.public.appointment.session'].href);
    }

    const authStatus = await ContactAuthService.getUserStatus(request);
    if (!authStatus) {
      console.info('[verify-mobile] redirect: missing auth status data', {
        userId: session.userId,
      });
      return redirect(ROUTES_MAP['booking.public.appointment.session'].href);
    }

    const verificationSessionToken = await VerificationTokenService.readVerificationToken(request);
    if (!verificationSessionToken) {
      console.info('[verify-mobile] redirect: missing verification token cookie', {
        userId: session.userId,
      });
      return redirect(ROUTES_MAP['booking.public.appointment.session.contact'].href);
    }

    if (authStatus.nextStep !== 'VERIFY_MOBILE') {
      console.info('[verify-mobile] redirect: nextStep is not VERIFY_MOBILE', {
        userId: session.userId,
        nextStep: authStatus.nextStep,
      });
      return redirectAuthStatusNextStepHref(authStatus);
    }

    return data({
      session,
      authStatus,
      verificationSessionToken,
    });
  } catch (error) {
    const { message } = resolveErrorPayload(error, 'Kunne ikke hente brukerdata');
    console.error('[verify-mobile] redirect: loader error', { message });
    return redirectWithError(request, ROUTES_MAP['booking.public.appointment.session'].href, message);
  }
}

export default function BookingPublicAppointmentSessionContactAuthVerifyMobileRoute({
  loaderData,
}: Route.ComponentProps) {
  const fetcher = useFetcher<typeof verifyMobileAction>();
  const statusFetcher = useFetcher<typeof userStatusLoader>();
  const resendFetcher = useFetcher<typeof resendVerificationMobileAction>();
  const [code, setCode] = React.useState('');
  const navigate = useNavigate();
  const didNavigateRef = React.useRef(false);
  const verificationSessionToken = loaderData.verificationSessionToken;
  const errorMessage =
    typeof fetcher.data === 'object' && fetcher.data && 'error' in fetcher.data ? fetcher.data.error : null;
  const resendMessage =
    typeof resendFetcher.data === 'object' && resendFetcher.data && 'message' in resendFetcher.data
      ? String(resendFetcher.data.message)
      : null;
  const resendError =
    typeof resendFetcher.data === 'object' && resendFetcher.data && 'error' in resendFetcher.data
      ? String(resendFetcher.data.error)
      : null;

  React.useEffect(() => {
    if (didNavigateRef.current) return;
    if (fetcher.state !== 'idle') return;
    if (!fetcher.data || typeof fetcher.data !== 'object') return;
    if (!('success' in fetcher.data) || fetcher.data.success !== true) return;
    if (!loaderData.session?.userId) return;

    const params = new URLSearchParams({ userId: String(loaderData.session.userId) });
    statusFetcher.load(`${API_ROUTES_MAP['auth.user-status'].url}?${params.toString()}`);
  }, [fetcher.state, fetcher.data, loaderData.session?.userId, statusFetcher]);

  React.useEffect(() => {
    if (didNavigateRef.current) return;
    if (!statusFetcher.data || typeof statusFetcher.data !== 'object') return;
    if ('error' in statusFetcher.data) return;
    if (!('nextStep' in statusFetcher.data) || !statusFetcher.data.nextStep) return;

    const nextStepHref = resolveAuthNextStepHref(statusFetcher.data.nextStep);
    if (!nextStepHref) return;

    didNavigateRef.current = true;
    navigate(nextStepHref, { replace: true });
  }, [statusFetcher.data, navigate]);

  return (
    <>
      <Stack space="xl">
        <PageHeader
          label="Kontakt"
          title="Bekreft mobil"
          description="Skriv inn koden vi har sendt på SMS for å bekrefte mobilnummeret."
        />
        <Panel title="Bekreft kode" tone="muted">
          <Stack space="md">
            {errorMessage ? (
              <Notice tone="emphasis" title="Kunne ikke bekrefte kode" message={String(errorMessage)} />
            ) : null}
            {resendError ? <Notice tone="emphasis" title="Kunne ikke sende ny SMS" message={String(resendError)} /> : null}
            {resendMessage ? <Notice title="Ny kode sendt" message={resendMessage} /> : null}
            <fetcher.Form method="post" action={API_ROUTES_MAP['auth.verify-mobile'].url}>
              <Stack space="md">
                <Stack space="xs">
                  <input type="hidden" name="verificationSessionToken" value={verificationSessionToken} />
                  <VerificationCodeInput
                    name="code"
                    value={code}
                    onChange={setCode}
                    length={CODE_LENGTH}
                    aria-invalid={Boolean(errorMessage)}
                  />
                </Stack>
                <Button type="submit" className="w-full" disabled={code.length !== CODE_LENGTH}>
                  Bekreft kode
                </Button>
              </Stack>
            </fetcher.Form>
            <resendFetcher.Form method="post" action={API_ROUTES_MAP['auth.resend-verification.mobile'].url}>
              <Stack space="sm">
                <input type="hidden" name="verificationSessionToken" value={verificationSessionToken} />
                <Button
                  type="submit"
                  fullWidth
                  variant="secondary"
                  disabled={!verificationSessionToken || resendFetcher.state !== 'idle'}
                >
                  Send SMS på nytt
                </Button>
              </Stack>
            </resendFetcher.Form>
          </Stack>
        </Panel>
      </Stack>
    </>
  );
}
