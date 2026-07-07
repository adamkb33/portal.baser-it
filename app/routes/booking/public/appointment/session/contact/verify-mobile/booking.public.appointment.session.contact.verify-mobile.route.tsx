import React from 'react';
import { data, Link, redirect, useFetcher, useLoaderData, useNavigate } from 'react-router';
import { ArrowLeft } from 'lucide-react';
import { API_ROUTES_MAP } from '~/lib/routing/route-tree';
import type { action as resendVerificationMobileAction } from '~/routes/api/auth/resend-verification/mobile/auth.resend-verification.mobile.api-route';
import type { action as verifyMobileAction } from '~/routes/api/auth/verify-mobile/auth.verify-mobile.api-route';
import { Button, Notice, PageHeader, Stack, VerificationCodeInput } from '~/ui';
import type { Route } from './+types/booking.public.appointment.session.contact.verify-mobile.route';
import { getBookingRouteMap } from '~/routes/booking/public/_utils/booking.route-map';
import { AppointmentSessionService } from '~/routes/booking/public/_services/booking.appointment-session.service.server';
import { VerificationTokenService } from '../_services/verification-token.service.server';
import { resolveErrorPayload } from '~/lib/api-error';
import { redirectWithError } from '~/lib/flash-message.server';
import { resolveAuthNextStepHref } from '../_utils/auth.utils';
import { BOOKING_CONTACT_PAGE_HEADER_CLASS } from '../_utils/booking-contact-theme';

export async function loader({ request }: Route.LoaderArgs) {
  const routes = getBookingRouteMap();

  try {
    const session = await AppointmentSessionService.get(request);

    if (!session || !session.userId) {
      console.info('[verify-mobile] redirect: missing session or userId', {
        hasSession: Boolean(session),
        userId: session?.userId ?? null,
      });
      return redirect(routes.session);
    }

    const verificationSessionToken = await VerificationTokenService.readVerificationToken(request);
    if (!verificationSessionToken) {
      console.info('[verify-mobile] redirect: missing verification token cookie', {
        userId: session.userId,
      });
      return redirect(routes.contact);
    }

    return data({
      session,
      verificationSessionToken,
      navigation: {
        currentStep: routes.contactVerifyMobile,
        previousStep: routes.contactCollectMobile,
      },
    });
  } catch (error) {
    const { message } = resolveErrorPayload(error, 'Kunne ikke hente brukerdata');
    console.error('[verify-mobile] redirect: loader error', { message });
    return redirectWithError(request, routes.session, message);
  }
}

const CODE_LENGTH = 6;
const AUTO_RESEND_STORAGE_PREFIX = 'booking-contact-mobile-code-sent';

export default function BookingContactVerifyMobilePage({ loaderData }: Route.ComponentProps) {
  const fetcher = useFetcher<typeof verifyMobileAction>();
  const resendFetcher = useFetcher<typeof resendVerificationMobileAction>();
  const [code, setCode] = React.useState('');
  const navigate = useNavigate();
  const didNavigateRef = React.useRef(false);
  const verificationSessionToken = loaderData.verificationSessionToken;
  const autoResendStorageKey = `${AUTO_RESEND_STORAGE_PREFIX}:${verificationSessionToken}`;
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
  const isSendingCode = resendFetcher.state !== 'idle';

  React.useEffect(() => {
    if (!verificationSessionToken || resendFetcher.state !== 'idle') return;
    if (typeof window === 'undefined') return;
    if (window.sessionStorage.getItem(autoResendStorageKey)) return;

    window.sessionStorage.setItem(autoResendStorageKey, 'true');
    resendFetcher.submit(
      { verificationSessionToken },
      { method: 'post', action: API_ROUTES_MAP['auth.resend-verification.mobile'].url },
    );
  }, [autoResendStorageKey, resendFetcher, verificationSessionToken]);

  React.useEffect(() => {
    if (didNavigateRef.current) return;
    if (fetcher.state !== 'idle') return;
    if (!fetcher.data || typeof fetcher.data !== 'object') return;
    if (!('success' in fetcher.data) || fetcher.data.success !== true) return;
    if (!('nextStep' in fetcher.data) || !fetcher.data.nextStep) return;

    const nextStepHref = resolveAuthNextStepHref(fetcher.data.nextStep);
    if (!nextStepHref) return;
    if (nextStepHref === loaderData.navigation.currentStep) return;

    didNavigateRef.current = true;
    navigate(nextStepHref, { replace: true });
  }, [fetcher.state, fetcher.data, loaderData.navigation.currentStep, navigate]);

  return (
    <Stack space="xl">
      <PageHeader
        label="Kontakt"
        title="Bekreft mobil"
        description="Skriv inn koden vi har sendt på SMS for å bekrefte mobilnummeret."
        className={BOOKING_CONTACT_PAGE_HEADER_CLASS}
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
          <Notice variant="booking" tone="emphasis" title="Kunne ikke bekrefte kode" message={String(errorMessage)} />
        ) : null}
        {resendError ? (
          <Notice variant="booking" tone="emphasis" title="Kunne ikke sende ny SMS" message={String(resendError)} />
        ) : null}
        {isSendingCode ? <Notice variant="booking" title="Sender SMS" message="Vi sender en ny kode til mobilnummeret ditt." /> : null}
        {resendMessage ? <Notice variant="booking" title="Ny kode sendt" message={resendMessage} /> : null}
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
                boxClassName="border-booking-border bg-booking-surface-strong text-booking-text data-[active=true]:border-booking-action data-[active=true]:ring-booking-action/25 data-[filled=true]:border-booking-action hover:border-booking-action"
              />
            </Stack>
            <Button type="submit" variant="booking-primary" className="w-full" disabled={code.length !== CODE_LENGTH}>
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
              variant="booking-secondary"
              disabled={!verificationSessionToken || isSendingCode}
            >
              {isSendingCode ? 'Sender SMS...' : 'Send SMS på nytt'}
            </Button>
          </Stack>
        </resendFetcher.Form>
      </Stack>
    </Stack>
  );
}
