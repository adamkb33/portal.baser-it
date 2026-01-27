import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BookingContainer, BookingSection, BookingStepHeader } from '../../../_components/booking-layout';
import { CONTACT_SIGN_IN_FETCHER_KEY } from '../_forms/fetcher-keys';
import { AuthSignInFetcherForm } from '../_forms/auth-signin.fetcher-form';
import { NoUserSessionNoAuthUserFlow } from './no-user-session-no-auth-user.flow';

type SessionUserNoAuthFlowProps = {
  email?: string | null;
  givenName?: string | null;
  familyName?: string | null;
};

const VIEW_DETAILS = 'details';
const VIEW_SIGN_IN = 'sign-in';
const VIEW_AUTH_OPTIONS = 'auth-options';

export function SessionUserNoAuthFlow({ email, givenName, familyName }: SessionUserNoAuthFlowProps) {
  const [view, setView] = React.useState<typeof VIEW_DETAILS | typeof VIEW_SIGN_IN | typeof VIEW_AUTH_OPTIONS>(
    VIEW_DETAILS,
  );
  const displayName = [givenName, familyName].filter(Boolean).join(' ');

  if (view === VIEW_AUTH_OPTIONS) {
    return <NoUserSessionNoAuthUserFlow onBack={() => setView(VIEW_DETAILS)} backLabel="Tilbake til brukeren" />;
  }

  if (view === VIEW_SIGN_IN) {
    return (
      <BookingContainer>
        <BookingStepHeader
          label="Kontakt"
          title="Logg inn for å fortsette"
          description="Skriv inn passordet ditt for å fortsette med denne brukeren."
        />
        <BookingSection title="Logg inn" variant="elevated">
          <AuthSignInFetcherForm fetcherId={CONTACT_SIGN_IN_FETCHER_KEY} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-form-text" htmlFor="contact-session-user-email">
                E-post
              </label>
              <Input
                id="contact-session-user-email"
                name="email"
                type="email"
                autoComplete="email"
                readOnly
                value={email ?? ''}
              />
              <input type="hidden" name="email" value={email ?? ''} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-form-text" htmlFor="contact-session-user-password">
                Passord
              </label>
              <Input
                id="contact-session-user-password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
              />
            </div>
            <div className="flex items-center gap-2">
              <Button type="submit" className="flex-1">
                Fortsett
              </Button>
              <Button type="button" variant="outline" onClick={() => setView(VIEW_DETAILS)}>
                Tilbake
              </Button>
            </div>
          </AuthSignInFetcherForm>
        </BookingSection>
      </BookingContainer>
    );
  }

  return (
    <BookingContainer>
      <BookingStepHeader
        label="Kontakt"
        title="Fortsett med denne brukeren?"
        description="Vi har funnet en eksisterende bruker knyttet til bestillingen."
      />
      <BookingSection title="Brukerdetaljer" variant="elevated">
        <div className="space-y-2 text-sm text-muted-foreground">
          {displayName ? (
            <div>
              <span className="font-medium text-card-text">Navn:</span> {displayName}
            </div>
          ) : null}
          {email ? (
            <div>
              <span className="font-medium text-card-text">E-post:</span> {email}
            </div>
          ) : null}
        </div>
        <div className="mt-4">
          <Button type="button" className="w-full" onClick={() => setView(VIEW_SIGN_IN)}>
            Fortsett med denne brukeren
          </Button>
          <Button type="button" variant="outline" className="mt-2 w-full" onClick={() => setView(VIEW_AUTH_OPTIONS)}>
            Logg inn med en annen bruker
          </Button>
        </div>
      </BookingSection>
    </BookingContainer>
  );
}
