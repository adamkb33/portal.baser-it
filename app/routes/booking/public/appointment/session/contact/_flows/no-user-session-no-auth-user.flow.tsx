import * as React from 'react';
import { useFetcher, useLocation } from 'react-router';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ROUTES_MAP } from '~/lib/route-tree';
import { GoogleSignInButton } from '~/routes/auth/sign-in/_components/google-sign-in-button';
import { AuthSignInFetcherForm } from '../_forms/auth-signin.fetcher-form';
import { AuthSignUpFetcherForm } from '../_forms/auth-signup.fetcher-form';
import { BookingContainer, BookingSection, BookingStepHeader } from '../../../_components/booking-layout';
import {
  CONTACT_PROVIDER_SIGN_IN_FETCHER_KEY,
  CONTACT_SIGN_IN_FETCHER_KEY,
  CONTACT_SIGN_UP_FETCHER_KEY,
} from '../_forms/fetcher-keys';

const VIEW_MENU = 'menu';
const VIEW_SIGN_IN = 'sign-in';
const VIEW_SIGN_UP = 'sign-up';

export function NoUserSessionNoAuthUserFlow() {
  const providerFetcher = useFetcher({ key: CONTACT_PROVIDER_SIGN_IN_FETCHER_KEY });
  const location = useLocation();
  const returnTo = `${location.pathname}${location.search}`;
  const isProviderSubmitting = providerFetcher.state === 'submitting';
  const [view, setView] = React.useState<typeof VIEW_MENU | typeof VIEW_SIGN_IN | typeof VIEW_SIGN_UP>(VIEW_MENU);
  const clickIndexRef = React.useRef(0);

  const logClick = React.useCallback((label: string) => {
    clickIndexRef.current += 1;
    console.log(`[booking-contact] click ${clickIndexRef.current}: ${label}`);
  }, []);

  React.useEffect(() => {
    console.log(`[booking-contact] view: ${view}`);
  }, [view]);

  const submitGoogleToken = React.useCallback(
    (token: string) => {
      logClick('provider:google');
      const formData = new FormData();
      formData.append('provider', 'GOOGLE');
      formData.append('idToken', token);
      providerFetcher.submit(formData, {
        method: 'post',
        action: `${ROUTES_MAP['auth.sign-in'].href}?returnTo=${encodeURIComponent(returnTo)}`,
      });
    },
    [providerFetcher, returnTo],
  );

  if (view === VIEW_MENU) {
    return (
      <BookingContainer>
        <BookingStepHeader
          label="Kontakt"
          title="Logg inn eller opprett bruker"
          description="For å fortsette bestillingen trenger vi en bruker."
        />
        <BookingSection title="Velg hvordan du vil fortsette" variant="elevated">
          <div className="space-y-3">
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => {
                logClick('view:sign-in');
                setView(VIEW_SIGN_IN);
              }}
            >
              Logg inn
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => {
                logClick('view:sign-up');
                setView(VIEW_SIGN_UP);
              }}
            >
              Opprett konto
            </Button>
          </div>
        </BookingSection>
      </BookingContainer>
    );
  }

  if (view === VIEW_SIGN_IN) {
    return (
      <BookingContainer>
        <BookingStepHeader
          label="Kontakt"
          title="Logg inn"
          description="Bruk eksisterende konto for å fortsette bestillingen."
        />
        <BookingSection title="Logg inn" variant="elevated">
          <div className="space-y-6">
            <GoogleSignInButton onCredential={submitGoogleToken} disabled={isProviderSubmitting} />
            <AuthSignInFetcherForm fetcherId={CONTACT_SIGN_IN_FETCHER_KEY} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-form-text" htmlFor="contact-signin-email">
                  E-post
                </label>
                <Input id="contact-signin-email" name="email" type="email" autoComplete="email" required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-form-text" htmlFor="contact-signin-password">
                  Passord
                </label>
                <Input
                  id="contact-signin-password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                />
              </div>
              <div className="flex items-center justify-between gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    logClick('back:sign-in');
                    setView(VIEW_MENU);
                  }}
                >
                  Tilbake
                </Button>
                <Button
                  type="submit"
                  onClick={() => {
                    logClick('submit:sign-in');
                  }}
                >
                  Logg inn
                </Button>
              </div>
            </AuthSignInFetcherForm>
          </div>
        </BookingSection>
      </BookingContainer>
    );
  }

  return (
    <BookingContainer>
      <BookingStepHeader
        label="Kontakt"
        title="Opprett konto"
        description="Opprett en bruker for å fortsette bestillingen."
      />
      <BookingSection title="Opprett konto" variant="elevated">
        <AuthSignUpFetcherForm fetcherId={CONTACT_SIGN_UP_FETCHER_KEY} className="space-y-4">
          <input type="hidden" name="intent" value="sign-up" />
          <div className="space-y-2">
            <label className="text-sm font-medium text-form-text" htmlFor="contact-signup-given-name">
              Fornavn
            </label>
            <Input id="contact-signup-given-name" name="givenName" autoComplete="given-name" required />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-form-text" htmlFor="contact-signup-family-name">
              Etternavn
            </label>
            <Input id="contact-signup-family-name" name="familyName" autoComplete="family-name" required />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-form-text" htmlFor="contact-signup-email">
              E-post
            </label>
            <Input id="contact-signup-email" name="email" type="email" autoComplete="email" required />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-form-text" htmlFor="contact-signup-mobile">
              Mobilnummer
            </label>
            <Input id="contact-signup-mobile" name="mobileNumber" type="tel" autoComplete="tel" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-form-text" htmlFor="contact-signup-password">
              Passord
            </label>
            <Input id="contact-signup-password" name="password" type="password" autoComplete="new-password" required />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-form-text" htmlFor="contact-signup-password2">
              Bekreft passord
            </label>
            <Input id="contact-signup-password2" name="password2" type="password" autoComplete="new-password" required />
          </div>
          <div className="flex items-center justify-between gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                logClick('back:sign-up');
                setView(VIEW_MENU);
              }}
            >
              Tilbake
            </Button>
            <Button
              type="submit"
              onClick={() => {
                logClick('submit:sign-up');
              }}
            >
              Opprett konto
            </Button>
          </div>
        </AuthSignUpFetcherForm>
      </BookingSection>
    </BookingContainer>
  );
}
