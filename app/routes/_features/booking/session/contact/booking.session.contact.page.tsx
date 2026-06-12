import React from 'react';
import { Form, Link, useNavigate } from 'react-router';
import { CalendarClock, LogIn, RefreshCcw, UserCheck, UserPlus } from 'lucide-react';
import { ProviderButtons } from '~/routes/auth/_components/provider-buttons';
import { resolveAuthStatusNextStepHref } from './_utils/auth.utils';
import type { UserAuthStatusDto } from '~/api/generated/base';
import type { createBookingSessionContactLoader } from './booking.session.contact.loader';
import { Button, Grid, Inline, PageHeader, Panel, Stack, Text } from '~/ui';
import { useLoaderData } from 'react-router';
import { ContinueCard } from './_components/continue-card';

const ACTION_INTENT = {
  CONTINUE_WITH_SESSION_USER: 'continue-with-session-user',
  CONTINUE_WITH_PROVIDER: 'continue-with-provider',
  CONTINUE_WITH_AUTHENTICATED_USER: 'continue-with-authenticated-user',
} as const;

export function BookingSessionContactPage() {
  const { sessionUser, auth, navigation } = useLoaderData<ReturnType<typeof createBookingSessionContactLoader>>();

  const navigate = useNavigate();
  const [showSwitchOptions, setShowSwitchOptions] = React.useState(false);

  const sessionUserEmail = sessionUser?.user.email?.toLowerCase();
  const authEmail = auth?.email?.toLowerCase();

  const isSameUser = Boolean(
    sessionUser &&
      auth &&
      (sessionUser.user.id === auth.id || (sessionUserEmail && authEmail && sessionUserEmail === authEmail)),
  );

  const sessionInitials =
    `${sessionUser?.user.givenName?.[0] ?? ''}${sessionUser?.user.familyName?.[0] ?? ''}`.toUpperCase() || 'U';
  const matchedSessionUserName =
    sessionUser && isSameUser ? `${sessionUser.user.givenName} ${sessionUser.user.familyName}`.trim() : '';
  const authDisplayName = matchedSessionUserName || auth?.email || (auth ? `Bruker #${auth.id}` : 'innlogget bruker');
  const authSupportingText =
    sessionUser && isSameUser && sessionUser.user.email ? sessionUser.user.email : 'Kontaktinformasjonen verifiseres før du går videre.';
  const authInitials =
    matchedSessionUserName
      .split(/\s+/)
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() ||
    auth?.email?.[0]?.toUpperCase() ||
    'U';

  const goToSignIn = React.useCallback(
    (authStatus?: UserAuthStatusDto | null) => {
      const nextStepHref = resolveAuthStatusNextStepHref(authStatus);
      if (nextStepHref) {
        navigate(nextStepHref);
        return;
      }
      const email = authStatus?.user?.email;
      navigate(email ? `sign-in?email=${email}` : 'sign-in');
    },
    [navigate],
  );

  const goToSignUp = React.useCallback(() => navigate('sign-up'), [navigate]);

  return (
    <Stack space="xl">
      <PageHeader
        label="Kontakt"
        title="Hvordan vil du fortsette?"
        description="Velg en av de følgende metodene for å fortsette."
      />

      <Panel title={auth ? 'Innlogget bruker' : 'Velg innloggingsmetode'} tone="muted" className="bg-booking-action-muted">
        <Stack space="lg">
          {auth ? (
            <div className="rounded-[var(--radius-booking-panel)] border-[length:var(--border-booking-card)] border-booking-border bg-booking-surface-raised p-4 shadow-[var(--shadow-booking-card)] md:p-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-[var(--radius-booking-badge)] bg-booking-action text-base font-semibold text-booking-action-contrast">
                    {authInitials}
                  </div>
                  <div className="min-w-0">
                    <Text as="p" variant="label" className="text-booking-text">
                      Du er logget inn som
                    </Text>
                    <Text as="p" variant="heading-sm" className="truncate text-booking-text">
                      {authDisplayName}
                    </Text>
                    <Text as="p" variant="body-sm" className="text-booking-text-muted">
                      {authSupportingText}
                    </Text>
                  </div>
                </div>

                <Inline space="sm" wrap>
                  <Link
                    to={navigation.myAppointments}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-[var(--radius-booking-control)] border-[length:var(--border-booking-control)] border-booking-border bg-booking-surface-raised px-4 text-base font-medium text-booking-text transition-colors hover:bg-booking-surface-muted focus-visible:outline-none focus-visible:ring-[length:var(--border-booking-focus-ring)] focus-visible:ring-booking-action"
                  >
                    <CalendarClock className="size-4" />
                    Mine bookinger
                  </Link>
                  <Button type="button" variant="secondary" className="gap-2" onClick={() => setShowSwitchOptions((prev) => !prev)}>
                    <RefreshCcw className="size-4" />
                    Bytt bruker
                  </Button>
                </Inline>
              </div>

              <Form method="post" className="mt-4">
                <input type="hidden" name="intent" value={ACTION_INTENT.CONTINUE_WITH_AUTHENTICATED_USER} />
                <Button type="submit" size="lg" fullWidth className="gap-3">
                  <UserCheck className="size-5" />
                  Fortsett med denne brukeren
                </Button>
              </Form>
            </div>
          ) : null}

          {!auth && sessionUser && (
            <ContinueCard
              title={`${sessionUser.user.givenName} ${sessionUser.user.familyName}`}
              description="Vi fant en eksisterende bruker. Fortsett for å verifisere og gå videre."
              cta="Fortsett med denne brukeren"
              initials={sessionInitials}
              intentValue={ACTION_INTENT.CONTINUE_WITH_SESSION_USER}
            />
          )}

          {(!auth || showSwitchOptions) && (
            <div className={auth ? 'rounded-[var(--radius-booking-panel)] border-[length:var(--border-booking-card)] border-booking-border bg-booking-surface-raised p-4 md:p-5' : undefined}>
              <Stack space="md">
                {auth ? (
                  <div>
                    <Text as="p" variant="label" className="text-booking-text">
                      Velg en annen bruker
                    </Text>
                    <Text as="p" variant="body-sm" className="text-booking-text-muted">
                      Logg inn med en annen konto eller opprett en ny bruker for denne bookingen.
                    </Text>
                  </div>
                ) : null}

                <Form method="post">
                  <input type="hidden" name="intent" value={ACTION_INTENT.CONTINUE_WITH_PROVIDER} />
                  <input type="hidden" name="redirectUrl" value="booking" />
                  <ProviderButtons />
                </Form>

                <Grid columns={2} gap="md">
                  <div className="space-y-2">
                    <Button type="button" size="lg" fullWidth onClick={() => goToSignIn()} className="gap-3">
                      <LogIn className="size-5" />
                      Logg inn
                    </Button>
                    <Text as="p" variant="body-sm" className="text-booking-text-muted">
                      Fortsett med en eksisterende konto.
                    </Text>
                  </div>
                  <div className="space-y-2">
                    <Button type="button" size="lg" fullWidth variant="outline" onClick={goToSignUp} className="gap-3">
                      <UserPlus className="size-5" />
                      Opprett konto
                    </Button>
                    <Text as="p" variant="body-sm" className="text-booking-text-muted">
                      Ny her? Lag en konto på et minutt.
                    </Text>
                  </div>
                </Grid>
              </Stack>
            </div>
          )}
        </Stack>
      </Panel>
    </Stack>
  );
}
