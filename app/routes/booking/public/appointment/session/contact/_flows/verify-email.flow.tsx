import * as React from 'react';
import { useFetcher, useRevalidator } from 'react-router';
import { Loader2 } from 'lucide-react';
import { BookingErrorBanner, BookingSection, BookingStepHeader } from '../../../_components/booking-layout';
import { API_ROUTES_MAP } from '~/lib/route-tree';
import { CONTACT_VERIFICATION_TOKEN_STORAGE_KEY } from '../_forms/session-keys';
import { getFetcherErrorMessage } from '../_utils/fetcher-error';

const POLL_INTERVAL_MS = 1000;

type VerifyEmailFlowProps = {
  email?: string | null;
};

export function VerifyEmailFlow({ email }: VerifyEmailFlowProps) {
  const fetcher = useFetcher();
  const revalidator = useRevalidator();
  const [verificationSessionToken, setVerificationSessionToken] = React.useState('');
  const bannerMessage = getFetcherErrorMessage(fetcher.data);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = window.sessionStorage.getItem(CONTACT_VERIFICATION_TOKEN_STORAGE_KEY);
    if (stored) {
      setVerificationSessionToken(stored);
    }
  }, []);

  React.useEffect(() => {
    if (!verificationSessionToken) return;

    const interval = window.setInterval(() => {
      if (fetcher.state !== 'idle') return;
      const action = API_ROUTES_MAP['auth.verification-status'].url;
      const params = new URLSearchParams({ verificationSessionToken });
      fetcher.load(`${action}?${params.toString()}`);
    }, POLL_INTERVAL_MS);

    return () => window.clearInterval(interval);
  }, [fetcher, verificationSessionToken]);

  React.useEffect(() => {
    if (typeof fetcher.data !== 'object' || !fetcher.data) return;
    const data = fetcher.data as { nextStep?: string | null; success?: boolean };
    if (data.success && data.nextStep && data.nextStep !== 'VERIFY_EMAIL') {
      revalidator.revalidate();
    }
  }, [fetcher.data, revalidator]);

  return (
    <>
      <BookingStepHeader label="Kontakt" title="Bekreft e-post" description="Følg lenken for å verifisere din epost." />
      {bannerMessage ? <BookingErrorBanner message={bannerMessage} sticky /> : null}
      <BookingSection title="Venter på verifisering" variant="elevated">
        <div className="flex items-start gap-3 rounded-md border border-border bg-muted/40 px-4 py-3">
          <Loader2 className="mt-0.5 size-5 animate-spin text-muted-foreground" />
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Vi venter på at du bekrefter e-posten din.</p>
            {email ? <p className="text-xs text-muted-foreground">Sjekk innboksen til {email}.</p> : null}
          </div>
        </div>
      </BookingSection>
    </>
  );
}
