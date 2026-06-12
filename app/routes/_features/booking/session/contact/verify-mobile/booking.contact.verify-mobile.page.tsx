import React from 'react';
import { Link, useFetcher, useLoaderData, useNavigate } from 'react-router';
import { ArrowLeft } from 'lucide-react';
import { API_ROUTES_MAP } from '~/lib/routing/route-tree';
import type { action as resendVerificationMobileAction } from '~/routes/api/auth/resend-verification/mobile/auth.resend-verification.mobile.api-route';
import type { action as verifyMobileAction } from '~/routes/api/auth/verify-mobile/auth.verify-mobile.api-route';
import type { loader as userStatusLoader } from '~/routes/api/auth/user-status/auth.user-status.api-route';
import { Button, Notice, PageHeader, Panel, Stack, VerificationCodeInput } from '~/ui';
import { resolveAuthNextStepHref } from '../_utils/auth.utils';
import type { createBookingContactVerifyMobileLoader } from './booking.contact.verify-mobile.loader';

const CODE_LENGTH = 6;

export function BookingContactVerifyMobilePage() {
  const loaderData = useLoaderData<ReturnType<typeof createBookingContactVerifyMobileLoader>>();
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

    const nextStepHref = resolveAuthNextStepHref(statusFetcher.data.nextStep, loaderData.surface);
    if (!nextStepHref) return;

    didNavigateRef.current = true;
    navigate(nextStepHref, { replace: true });
  }, [statusFetcher.data, loaderData.surface, navigate]);

  return (
    <Stack space="xl">
      <PageHeader
        label="Kontakt"
        title="Bekreft mobil"
        description="Skriv inn koden vi har sendt på SMS for å bekrefte mobilnummeret."
      />
      <Stack space="md">
        <Link
          to={loaderData.navigation.previousStep}
          className="inline-flex h-10 w-fit items-center justify-center gap-2 rounded-[var(--radius-booking-control)] px-4 text-base font-medium text-booking-action transition-colors hover:bg-booking-action-muted focus-visible:outline-none focus-visible:ring-[length:var(--border-booking-focus-ring)] focus-visible:ring-booking-action"
        >
          <ArrowLeft className="size-4" />
          Endre mobilnummer
        </Link>
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
    </Stack>
  );
}
