import * as React from 'react';
import { Link, useFetcher, useLoaderData, useLocation, useNavigate } from 'react-router';
import { ArrowLeft, CheckCircle2, Loader2, Mail, MailCheck } from 'lucide-react';
import { API_ROUTES_MAP } from '~/lib/routing/route-tree';
import type { loader as userStatusLoader } from '~/routes/api/auth/user-status/auth.user-status.api-route';
import type { action as resendVerificationAction } from '~/routes/api/auth/resend-verification/email/auth.resend-verification.email.api-route';
import { Button, Notice, PageHeader, Stack, Text } from '~/ui';
import { resolveAuthNextStepHref } from '../_utils/auth.utils';
import { BOOKING_CONTACT_PAGE_HEADER_CLASS } from '../_utils/booking-contact-theme';
import type { createBookingContactVerifyEmailLoader } from './booking.contact.verify-email.loader';

export const handle = {
  contactFlow: true,
} as const;

export function BookingContactVerifyEmailPage() {
  const loaderData = useLoaderData<ReturnType<typeof createBookingContactVerifyEmailLoader>>();
  const email = loaderData.authStatus.user?.email ?? '';
  const userId = loaderData.session?.userId;
  const statusFetcher = useFetcher<typeof userStatusLoader>();
  const resendFetcher = useFetcher<typeof resendVerificationAction>();
  type StatusFetcherData = typeof statusFetcher.data;
  const navigate = useNavigate();
  const location = useLocation();
  const didNavigateRef = React.useRef(false);
  const redirectHint = React.useMemo(() => new URLSearchParams(location.search).get('redirectUrl'), [location.search]);

  const resendError =
    typeof resendFetcher.data === 'object' && resendFetcher.data && 'error' in resendFetcher.data
      ? String(resendFetcher.data.error)
      : null;
  const resendSuccess =
    typeof resendFetcher.data === 'object' && resendFetcher.data && 'message' in resendFetcher.data
      ? String(resendFetcher.data.message)
      : null;

  const statusFetcherError =
    typeof statusFetcher.data === 'object' && statusFetcher.data && 'error' in statusFetcher.data
      ? String(statusFetcher.data.error)
      : null;
  const errorCountRef = React.useRef(0);

  const companyIdParam = React.useMemo(() => {
    return new URLSearchParams(location.search).get('companyId');
  }, [location.search]);

  React.useEffect(() => {
    if (!userId) return;

    const interval = window.setInterval(() => {
      if (errorCountRef.current >= 5) {
        console.warn('[verify-email] Stopped polling due to repeated errors');
        return;
      }

      if (statusFetcher.state !== 'idle') return;
      const params = new URLSearchParams({ userId: String(userId) });
      statusFetcher.load(`${API_ROUTES_MAP['auth.user-status'].url}?${params.toString()}`);
    }, 1000);

    return () => window.clearInterval(interval);
  }, [statusFetcher, userId]);

  React.useEffect(() => {
    if (statusFetcherError) {
      errorCountRef.current += 1;
    } else if (statusFetcher.data && typeof statusFetcher.data === 'object' && !('error' in statusFetcher.data)) {
      errorCountRef.current = 0;
    }
  }, [statusFetcher.data, statusFetcherError]);

  React.useEffect(() => {
    if (typeof statusFetcher.data === 'undefined') return;
    if (didNavigateRef.current || typeof window === 'undefined') return;

    const data = statusFetcher.data as StatusFetcherData;

    if (data && typeof data === 'object' && 'nextStep' in data && data.nextStep && data.nextStep !== 'VERIFY_EMAIL') {
      const nextStepHref = resolveAuthNextStepHref(data.nextStep, loaderData.surface);

      if (nextStepHref) {
        didNavigateRef.current = true;
        const targetUrl = companyIdParam ? `${nextStepHref}?companyId=${companyIdParam}` : nextStepHref;
        console.log('[verify-email] Email verified, navigating to:', targetUrl);
        navigate(targetUrl, { replace: true });
      }
    }
  }, [statusFetcher.data, companyIdParam, loaderData.surface, navigate]);

  return (
    <Stack space="xl">
      <PageHeader
        label="Kontakt"
        title="Bekreft e-post"
        description="Klikk på lenken i e-posten for å fullføre verifiseringen."
        className={BOOKING_CONTACT_PAGE_HEADER_CLASS}
      />
      {redirectHint === 'booking' ? (
        <div className="rounded-[var(--radius-booking-card)] border-[length:var(--border-booking-card)] border-booking-border bg-booking-surface-raised p-3 text-sm text-booking-text">
          Du kan nå fortsette med bookingen. Gå tilbake til bookingsteget for å fullføre.
        </div>
      ) : null}
      <Stack space="md">
        <Link
          to={loaderData.navigation.previousStep}
          className="inline-flex h-10 w-fit items-center justify-center gap-2 rounded-[var(--radius-booking-control)] px-4 text-base font-medium text-booking-action transition-colors hover:bg-booking-action-muted focus-visible:outline-none focus-visible:ring-[length:var(--border-booking-focus-ring)] focus-visible:ring-booking-action"
        >
          <ArrowLeft className="size-4" />
          Endre e-postadresse
        </Link>
        {statusFetcherError && errorCountRef.current >= 3 ? (
          <Notice
            variant="booking"
            tone="muted"
            title="Kunne ikke sjekke verifiseringsstatus automatisk"
            message="Prøv igjen om litt, eller oppdater siden."
          />
        ) : null}
        {resendError ? (
          <Notice variant="booking" tone="emphasis" title="Kunne ikke sende ny e-post" message={resendError} />
        ) : null}
        {resendSuccess ? <Notice variant="booking" title="Ny e-post sendt" message={resendSuccess} /> : null}
        <div className="rounded-[var(--radius-booking-card)] border-[length:var(--border-booking-card)] border-booking-border bg-booking-surface-raised p-4 md:p-5">
          <div className="flex items-start gap-3">
            <Loader2 className="size-10 animate-spin text-booking-action" />
            <div className="space-y-1">
              <Text as="p" variant="heading-sm" className="text-booking-text">
                Vi venter på bekreftelse
              </Text>
              <Text as="p" className="text-booking-text-muted">
                Når du bekrefter e-posten, tar vi deg videre automatisk.
              </Text>
            </div>
          </div>
        </div>

        <div className="rounded-[var(--radius-booking-card)] border-[length:var(--border-booking-card)] border-booking-border bg-booking-surface-raised p-3 md:p-4">
          <div className="flex items-start gap-3">
            <div className="flex size-10 items-center justify-center rounded-[var(--radius-booking-badge)] bg-booking-surface-muted text-booking-text-muted">
              <Mail className="size-5" />
            </div>
            <div className="space-y-1">
              <Text as="p" variant="label">
                E-post sendt
              </Text>
              <Text as="p" variant="body-sm" className="text-booking-text-muted">
                {email ? `Sjekk innboksen til ${email}.` : 'Sjekk innboksen din for verifiseringslenken.'}
              </Text>
            </div>
          </div>
        </div>

        <ol className="space-y-3 rounded-[var(--radius-booking-card)] border-[length:var(--border-booking-card)] border-booking-border bg-booking-surface-raised p-4">
          <li className="flex items-start gap-3">
            <div className="mt-0.5 flex size-6 items-center justify-center rounded-[var(--radius-booking-badge)] bg-booking-surface-muted text-booking-text">
              <Mail className="size-3.5" />
            </div>
            <div>
              <Text as="p" variant="label">
                Åpne e-posten og klikk på lenken
              </Text>
              <Text as="p" variant="body-sm" className="text-booking-text-muted">
                Bekreft e-postadressen din for å fortsette.
              </Text>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <div className="mt-0.5 flex size-6 items-center justify-center rounded-[var(--radius-booking-badge)] bg-booking-surface-muted text-booking-text">
              <CheckCircle2 className="size-3.5" />
            </div>
            <div>
              <Text as="p" variant="label">
                Kom tilbake hit
              </Text>
              <Text as="p" variant="body-sm" className="text-booking-text-muted">
                Vi sjekker status automatisk og sender deg videre.
              </Text>
            </div>
          </li>
        </ol>

        <div>
          <resendFetcher.Form method="post" action={API_ROUTES_MAP['auth.resend-verification.email'].url}>
            <Stack space="sm">
              <input type="hidden" name="redirectUrl" value="booking" />
              <input type="hidden" name="email" value={email} />
              <input type="hidden" name="sendEmail" value="true" />
              <input type="hidden" name="sendMobile" value="false" />
              <Button
                type="submit"
                size="lg"
                fullWidth
                variant="booking-secondary"
                className="gap-3"
                loading={resendFetcher.state !== 'idle'}
                disabled={!email}
              >
                <MailCheck className="size-5" />
                Send e-posten på nytt
              </Button>
            </Stack>
          </resendFetcher.Form>
        </div>
      </Stack>
    </Stack>
  );
}
