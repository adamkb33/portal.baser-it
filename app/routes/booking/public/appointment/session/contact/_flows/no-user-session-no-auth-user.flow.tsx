import * as React from 'react';
import { useFetcher, useLocation, useRevalidator } from 'react-router';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { API_ROUTES_MAP, ROUTES_MAP } from '~/lib/route-tree';
import { GoogleSignInButton } from '~/routes/auth/sign-in/_components/google-sign-in-button';
import { AuthSignInFetcherForm } from '../_forms/auth-signin.fetcher-form';
import { AuthSignUpFetcherForm } from '../_forms/auth-signup.fetcher-form';
import {
  BookingContainer,
  BookingErrorBanner,
  BookingSection,
  BookingStepHeader,
} from '../../../_components/booking-layout';
import {
  CONTACT_PROVIDER_SIGN_IN_FETCHER_KEY,
  CONTACT_SIGN_IN_FETCHER_KEY,
  CONTACT_SIGN_UP_FETCHER_KEY,
} from '../_forms/fetcher-keys';
import { ACTION_INTENT } from '../booking.public.appointment.session.contact.route';
import { getFetcherErrorMessage } from '../_utils/fetcher-error';

const VIEW_MENU = 'menu';
const VIEW_SIGN_IN = 'sign-in';
const VIEW_SIGN_UP = 'sign-up';
const SIGN_IN_STORAGE_KEY = 'booking-contact:sign-in';
const SIGN_UP_STORAGE_KEY = 'booking-contact:sign-up';
const VIEW_STORAGE_KEY = 'booking-contact:view';

type SignInDraft = {
  email: string;
};

type SignUpDraft = {
  givenName: string;
  familyName: string;
  email: string;
  mobileNumber: string;
};

const readSessionStorage = <T,>(key: string, fallback: T): T => {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.sessionStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};

const writeSessionStorage = (key: string, value: unknown) => {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore write failures
  }
};

type NoUserSessionNoAuthUserFlowProps = {
  onBack?: () => void;
  backLabel?: string;
};

export function NoUserSessionNoAuthUserFlow({ onBack, backLabel = 'Tilbake' }: NoUserSessionNoAuthUserFlowProps) {
  const providerFetcher = useFetcher({ key: CONTACT_PROVIDER_SIGN_IN_FETCHER_KEY });
  const signInFetcher = useFetcher({ key: CONTACT_SIGN_IN_FETCHER_KEY });
  const signUpFetcher = useFetcher({ key: CONTACT_SIGN_UP_FETCHER_KEY });
  const location = useLocation();
  const revalidator = useRevalidator();
  const returnTo = `${location.pathname}${location.search}`;
  const isProviderSubmitting = providerFetcher.state === 'submitting';
  const [view, setView] = React.useState<typeof VIEW_MENU | typeof VIEW_SIGN_IN | typeof VIEW_SIGN_UP>(VIEW_MENU);
  const [signInDraft, setSignInDraft] = React.useState<SignInDraft>({ email: '' });
  const [signUpDraft, setSignUpDraft] = React.useState<SignUpDraft>({
    givenName: '',
    familyName: '',
    email: '',
    mobileNumber: '',
  });
  const clickIndexRef = React.useRef(0);
  const hasHydratedRef = React.useRef(false);

  const logClick = React.useCallback((label: string) => {
    clickIndexRef.current += 1;
    console.log(`[booking-contact] click ${clickIndexRef.current}: ${label}`);
  }, []);

  React.useEffect(() => {
    if (!hasHydratedRef.current) {
      setView(readSessionStorage(VIEW_STORAGE_KEY, VIEW_MENU));
      setSignInDraft(readSessionStorage(SIGN_IN_STORAGE_KEY, { email: '' }));
      setSignUpDraft(
        readSessionStorage(SIGN_UP_STORAGE_KEY, { givenName: '', familyName: '', email: '', mobileNumber: '' }),
      );
      hasHydratedRef.current = true;
      return;
    }

    console.log(`[booking-contact] view: ${view}`);
    writeSessionStorage(VIEW_STORAGE_KEY, view);
  }, [view]);

  React.useEffect(() => {
    if (!hasHydratedRef.current) return;
    writeSessionStorage(SIGN_IN_STORAGE_KEY, signInDraft);
  }, [signInDraft]);

  React.useEffect(() => {
    if (!hasHydratedRef.current) return;
    writeSessionStorage(SIGN_UP_STORAGE_KEY, signUpDraft);
  }, [signUpDraft]);

  const updateSignInDraft = React.useCallback((next: SignInDraft) => {
    setSignInDraft(next);
  }, []);

  const updateSignUpDraft = React.useCallback((next: SignUpDraft) => {
    setSignUpDraft(next);
  }, []);

  const submitGoogleToken = React.useCallback(
    (token: string) => {
      logClick('provider:google');
      const formData = new FormData();
      formData.append('provider', 'GOOGLE');
      formData.append('idToken', token);
      providerFetcher.submit(formData, {
        method: 'post',
        action: API_ROUTES_MAP['auth.sign-in'].url,
      });
    },
    [providerFetcher],
  );

  React.useEffect(() => {
    if (typeof providerFetcher.data !== 'object' || !providerFetcher.data) return;
    const data = providerFetcher.data as { success?: boolean };
    if (data.success) {
      revalidator.revalidate();
    }
  }, [providerFetcher.data, revalidator]);

  const backButton = onBack ? (
    <div className="mt-4">
      <Button type="button" variant="outline" className="w-full" onClick={onBack}>
        {backLabel}
      </Button>
    </div>
  ) : null;

  const bannerMessage =
    getFetcherErrorMessage(providerFetcher.data) ??
    getFetcherErrorMessage(signInFetcher.data) ??
    getFetcherErrorMessage(signUpFetcher.data);

  if (view === VIEW_MENU) {
    return (
      <BookingContainer>
        <BookingStepHeader
          label="Kontakt"
          title="Logg inn eller opprett bruker"
          description="For å fortsette bestillingen trenger vi en bruker."
        />
        {bannerMessage ? <BookingErrorBanner message={bannerMessage} sticky /> : null}

        <BookingSection title="Velg hvordan du vil fortsette" variant="elevated">
          <div className="space-y-3">
            <GoogleSignInButton onCredential={submitGoogleToken} disabled={isProviderSubmitting} />

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
          {backButton}
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
        {bannerMessage ? <BookingErrorBanner message={bannerMessage} sticky /> : null}
        <BookingSection title="Logg inn" variant="elevated">
          <div className="space-y-6">
            <AuthSignInFetcherForm fetcherId={CONTACT_SIGN_IN_FETCHER_KEY} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-form-text" htmlFor="contact-signin-email">
                  E-post
                </label>
                <Input
                  id="contact-signin-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={signInDraft.email}
                  onChange={(event) => updateSignInDraft({ email: event.target.value })}
                />
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
          {backButton}
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
      {bannerMessage ? <BookingErrorBanner message={bannerMessage} sticky /> : null}
      <BookingSection title="Opprett konto" variant="elevated">
        <AuthSignUpFetcherForm fetcherId={CONTACT_SIGN_UP_FETCHER_KEY} className="space-y-4">
          <input type="hidden" name="intent" value={ACTION_INTENT.SIGN_UP_LOCAL} />
          <div className="space-y-2">
            <label className="text-sm font-medium text-form-text" htmlFor="contact-signup-given-name">
              Fornavn
            </label>
            <Input
              id="contact-signup-given-name"
              name="givenName"
              autoComplete="given-name"
              required
              value={signUpDraft.givenName}
              onChange={(event) => updateSignUpDraft({ ...signUpDraft, givenName: event.target.value })}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-form-text" htmlFor="contact-signup-family-name">
              Etternavn
            </label>
            <Input
              id="contact-signup-family-name"
              name="familyName"
              autoComplete="family-name"
              required
              value={signUpDraft.familyName}
              onChange={(event) => updateSignUpDraft({ ...signUpDraft, familyName: event.target.value })}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-form-text" htmlFor="contact-signup-email">
              E-post
            </label>
            <Input
              id="contact-signup-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={signUpDraft.email}
              onChange={(event) => updateSignUpDraft({ ...signUpDraft, email: event.target.value })}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-form-text" htmlFor="contact-signup-mobile">
              Mobilnummer
            </label>
            <Input
              id="contact-signup-mobile"
              name="mobileNumber"
              type="tel"
              autoComplete="tel"
              value={signUpDraft.mobileNumber}
              onChange={(event) => updateSignUpDraft({ ...signUpDraft, mobileNumber: event.target.value })}
            />
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
            <Input
              id="contact-signup-password2"
              name="password2"
              type="password"
              autoComplete="new-password"
              required
            />
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
        {backButton}
      </BookingSection>
    </BookingContainer>
  );
}
