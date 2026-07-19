import { useState } from 'react';
import { Form, data, redirect, useNavigation } from 'react-router';
import { BadgeCheck, Mail, Phone, Plus, UserRound } from 'lucide-react';
import { PublicAppointmentSessionController } from '~/api/generated/booking';
import { withAuth } from '~/api/utils/with-auth';
import { resolveErrorPayload } from '~/lib/api-error';
import { authService } from '~/lib/auth-service';
import { logger } from '~/lib/logger';
import { accessTokenCookie } from '~/routes/auth/_features/auth.cookies.server';
import { BookingActionButton } from '~/routes/booking/public/_components/booking-action-button';
import { BookingFooterNav } from '~/routes/booking/public/_components/booking-footer-nav';
import { BookingLink } from '~/routes/booking/public/_components/booking-link';
import {
  getBookingSessionLogContext,
  withBookingBackendCall,
  withBookingFlowLog,
} from '~/routes/booking/public/_utils/booking-flow-log.server';
import { requireBookingSession } from '~/routes/booking/public/_utils/booking.require-authenticated-flow.server';
import { getBookingRouteMap } from '~/routes/booking/public/_utils/booking.route-map';
import { Button, Input, Label, Notice, Stack, Text } from '~/ui';
import { submitContactFormSchema } from './_schemas/submit-contact.form.schema';
import { BOOKING_CONTACT_LABEL_CLASS, BOOKING_CONTACT_PAGE_HEADER_CLASS } from './_utils/booking-contact-theme';
import type { Route } from './+types/booking.public.appointment.session.contact.route';

const ROUTE_ID = 'booking.public.appointment.session.contact';

type ContactState = 'RESUME' | 'CONTINUE_AS' | 'FORM' | 'ERROR';

const CARD_CLASS =
  'rounded-[var(--radius-booking-panel)] border-[length:var(--border-booking-card)] border-booking-border bg-booking-surface-raised shadow-[var(--shadow-booking-card)]';

/**
 * Only used to check whether the browser is signed in before hitting the backend.
 * The actual Authorization header for backend calls is attached by `withAuth`, which
 * serializes access to the generated clients' process-wide singleton config — passing
 * an empty headers object per-call here instead would get stripped by the SDK's
 * `stripEmptySlots` and silently fall back to whatever token another concurrent
 * request last left on the shared client (a cross-user auth leak).
 */
async function getAuthHeader(request: Request): Promise<Record<string, string>> {
  const token = await accessTokenCookie.parse(request.headers.get('Cookie'));
  return typeof token === 'string' && token ? { Authorization: `Bearer ${token}` } : {};
}

// ---------- loader: the four-rule cascade, top to bottom, first match wins ----------

export async function loader({ request }: Route.LoaderArgs) {
  return withBookingFlowLog({ request, routeId: ROUTE_ID, kind: 'loader', step: 'contact' }, async () => {
    const routes = getBookingRouteMap();
    const url = new URL(request.url);

    const guardResult = await requireBookingSession(request);
    if (guardResult instanceof Response) return guardResult;
    const { session } = guardResult;

    // Pre-contact selection guard: contact requires completed selections.
    if (!session.selectedProfileId) return redirect(routes.employee);
    if (!session.selectedServices?.length) return redirect(routes.selectServices);
    if (!session.selectedStartTime) return redirect(routes.selectTime);

    try {
      const requirementsResponse = await withBookingBackendCall(
        { request, routeId: ROUTE_ID, step: 'contact', call: 'get-requirements', session },
        () =>
          withAuth(request, () =>
            PublicAppointmentSessionController.getAppointmentSessionRequirements({
              path: { sessionId: session.sessionId },
            }),
          ),
      );
      const requirements = requirementsResponse.data?.data ?? null;

      // Rule 1: a code is pending — return to verification unless the user chose to edit the form.
      if (requirements?.nextStep === 'VERIFY_MOBILE' && !url.searchParams.has('form')) {
        const challengeParam = requirements.challengeId ? `?challengeId=${requirements.challengeId}` : '';
        return redirect(`${routes.contactVerifyMobile}${challengeParam}`);
      }

      // Rule 2: session already has a verified user — resume, never auto-forward.
      if (requirements?.nextStep === 'DONE' && session.userId) {
        logger.info('[booking:contact:loader]', {
          ...getBookingSessionLogContext(session),
          contactState: 'RESUME',
        });
        return data({
          session,
          requirements,
          contactState: 'RESUME' as ContactState,
          resumeUser: {
            displayName: requirements.displayName ?? null,
            maskedMobile: requirements.maskedMobile ?? null,
          },
          authenticatedUser: null,
          requirementsError: null as string | null,
        });
      }

      // Rule 3: browser is signed in — offer one-tap attach. `?form=1` = "Ikke deg?" opt-out.
      if (requirements?.canAttachAuthenticatedUser && !url.searchParams.has('form')) {
        logger.info('[booking:contact:loader]', {
          ...getBookingSessionLogContext(session),
          contactState: 'CONTINUE_AS',
        });
        return data({
          session,
          requirements,
          contactState: 'CONTINUE_AS' as ContactState,
          resumeUser: null,
          authenticatedUser: { displayName: requirements.authenticatedUserDisplayName ?? null },
          requirementsError: null as string | null,
        });
      }

      // Rule 4: the form.
      logger.info('[booking:contact:loader]', {
        ...getBookingSessionLogContext(session),
        contactState: 'FORM',
      });
      return data({
        session,
        requirements,
        contactState: 'FORM' as ContactState,
        resumeUser: null,
        authenticatedUser: null,
        requirementsError: null as string | null,
      });
    } catch (error) {
      // Transient requirements failure: keep the session, render the form + a notice.
      const { message } = resolveErrorPayload(error, 'Kunne ikke hente bookingstatus');
      logger.error('[booking:contact:loader]', {
        ...getBookingSessionLogContext(session),
        contactState: 'ERROR',
        message,
      });
      return data({
        session,
        requirements: null,
        contactState: 'ERROR' as ContactState,
        resumeUser: null,
        authenticatedUser: null,
        requirementsError: message,
      });
    }
  });
}

// ---------- action: three intents — identify (default), attach, clear ----------

export async function action({ request }: Route.ActionArgs) {
  return withBookingFlowLog({ request, routeId: ROUTE_ID, kind: 'action', step: 'contact' }, async () => {
    const routes = getBookingRouteMap();

    const guardResult = await requireBookingSession(request);
    if (guardResult instanceof Response) return guardResult;
    const { session } = guardResult;

    const formData = await request.formData();
    const intent = String(formData.get('intent') || 'identify');

    // "Endre kontaktinformasjon" / switch person: detach the session user, loader re-resolves.
    if (intent === 'clear') {
      try {
        await withBookingBackendCall(
          { request, routeId: ROUTE_ID, step: 'contact', call: 'clear-session-user', session },
          () =>
            withAuth(request, () =>
              PublicAppointmentSessionController.clearAppointmentSessionUser({
                path: { sessionId: session.sessionId },
              }),
            ),
        );
        return redirect(`${routes.contact}?form=1`);
      } catch (error) {
        const { message } = resolveErrorPayload(error, 'Kunne ikke endre kontaktinformasjon');
        return data({ error: message }, { status: 400 });
      }
    }

    // RESUME primary: session already has a verified user (nextStep DONE) but the browser's
    // own login may have expired or been cleared — mint fresh auth cookies from the session's
    // own identity so "Mine bookinger" works afterward too.
    if (intent === 'resume') {
      try {
        const response = await withBookingBackendCall(
          { request, routeId: ROUTE_ID, step: 'contact', call: 'resume-session', session },
          () =>
            withAuth(request, () =>
              PublicAppointmentSessionController.resumeAppointmentSession({
                path: { sessionId: session.sessionId },
              }),
            ),
        );
        const authTokens = response.data?.data?.authTokens;
        const headers = authTokens
          ? await authService.setAuthCookies(
              authTokens.accessToken,
              authTokens.refreshToken,
              authTokens.accessTokenExpiresAt,
              authTokens.refreshTokenExpiresAt,
            )
          : undefined;
        return redirect(routes.overview, headers ? { headers } : undefined);
      } catch (error) {
        const { message } = resolveErrorPayload(error, 'Kunne ikke fortsette bookingen');
        return data({ error: message }, { status: 400 });
      }
    }

    // CONTINUE_AS primary: attach the authenticated browser user. Principal comes from the
    // Authorization header — never from form data.
    if (intent === 'attach') {
      try {
        const authHeader = await getAuthHeader(request);
        if (!authHeader.Authorization) {
          return data({ error: 'Du er ikke lenger innlogget. Fyll ut skjemaet under.' }, { status: 401 });
        }
        const response = await withBookingBackendCall(
          { request, routeId: ROUTE_ID, step: 'contact', call: 'set-pending-user', session },
          () =>
            withAuth(request, () =>
              PublicAppointmentSessionController.setPendingAppointmentSessionUser({
                path: { sessionId: session.sessionId },
              }),
            ),
        );
        const nextStep = response.data?.data?.nextStep;
        if (nextStep === 'DONE') return redirect(routes.overview);
        if (nextStep === 'VERIFY_MOBILE') return redirect(routes.contactVerifyMobile);
        // Unknown shape: bounce to contact and let the loader cascade re-resolve. Safe either way.
        return redirect(routes.contact);
      } catch (error) {
        const { message } = resolveErrorPayload(error, 'Kunne ikke fortsette med innlogget bruker');
        return data({ error: message }, { status: 400 });
      }
    }

    // Default: identify — the guest contact form.
    const parsed = submitContactFormSchema.safeParse({
      companyId: session.companyId,
      givenName: String(formData.get('givenName') || '').trim(),
      familyName: String(formData.get('familyName') || '').trim(),
      mobileNumber: String(formData.get('mobileNumber') || '').trim(),
      email: String(formData.get('email') || '').trim(),
    });
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message || 'Kontroller kontaktinformasjonen og prøv igjen.';
      return data({ error: firstError }, { status: 400 });
    }

    try {
      const response = await withBookingBackendCall(
        {
          request,
          routeId: ROUTE_ID,
          step: 'contact',
          call: 'identify-user',
          session,
          context: { hasEmail: Boolean(parsed.data.email) },
        },
        () =>
          withAuth(request, () =>
            PublicAppointmentSessionController.identifyAppointmentSessionUser({
              path: { sessionId: session.sessionId },
              body: {
                givenName: parsed.data.givenName,
                familyName: parsed.data.familyName,
                mobileNumber: parsed.data.mobileNumber,
                email: parsed.data.email, // schema transforms '' → undefined; only sent when filled
              },
            }),
          ),
      );

      const result = response.data?.data;
      logger.info('[booking:contact:action]', {
        ...getBookingSessionLogContext(session),
        intent,
        nextStep: result?.nextStep ?? null,
      });

      if (result?.nextStep === 'DONE') return redirect(routes.overview);
      const challengeParam = result?.challengeId ? `?challengeId=${result.challengeId}` : '';
      return redirect(`${routes.contactVerifyMobile}${challengeParam}`);
    } catch (error) {
      const { message } = resolveErrorPayload(error, 'Kunne ikke lagre kontaktinformasjon');
      return data({ error: message }, { status: 400 });
    }
  });
}

// ---------- component: renders exactly one of RESUME / CONTINUE_AS / FORM(+ERROR notice) ----------

export default function BookingSessionContactPage({ loaderData, actionData }: Route.ComponentProps) {
  const navigation = useNavigation();
  const isSubmitting = navigation.state !== 'idle';
  const routes = getBookingRouteMap();
  const errorMessage =
    actionData && typeof actionData === 'object' && 'error' in actionData ? String(actionData.error) : null;

  const { contactState, resumeUser, authenticatedUser, requirementsError } = loaderData;

  return (
    <Stack space="xl">
      {/* Constrained reading width: full-bleed 3-line cards are what made this feel flat. */}
      <div className="mx-auto w-full max-w-2xl space-y-6">
        <div className={BOOKING_CONTACT_PAGE_HEADER_CLASS}>
          <Text as="p" variant="overline" className="text-booking-action">
            Kontakt
          </Text>
          <Text as="h1" variant="heading-lg" className="text-booking-text">
            {contactState === 'RESUME'
              ? 'Kontaktinformasjonen din er bekreftet'
              : 'Hvem skal vi sende bekreftelsen til?'}
          </Text>
          {contactState !== 'RESUME' && (
            <Text as="p" variant="body" className="max-w-2xl text-booking-text-muted">
              Vi sender en SMS-kode til mobilnummeret ditt før timen bekreftes. E-post er valgfritt.
            </Text>
          )}
        </div>

        {errorMessage ? (
          <Notice variant="booking" tone="emphasis" title="Kunne ikke fortsette" message={errorMessage} />
        ) : null}
        {requirementsError ? (
          <Notice
            variant="booking"
            tone="emphasis"
            title="Kunne ikke hente bookingstatus"
            message="Prøv igjen om litt. Kontaktinformasjonen din kan fortsatt fylles ut."
          />
        ) : null}

        {contactState === 'RESUME' ? (
          <ResumeCard resumeUser={resumeUser} isSubmitting={isSubmitting} />
        ) : contactState === 'CONTINUE_AS' ? (
          <ContinueAsCard authenticatedUser={authenticatedUser} routes={routes} isSubmitting={isSubmitting} />
        ) : (
          <ContactForm routes={routes} isSubmitting={isSubmitting} />
        )}
      </div>

      {/* Footers stay outside the constrained column so the sticky bar spans as before. */}
      {contactState === 'RESUME' ? (
        <Form method="post">
          <input type="hidden" name="intent" value="resume" readOnly />
          <BookingFooterNav>
            <BookingLink to={routes.selectTime} variant="secondary" disabled={isSubmitting}>
              Tilbake
            </BookingLink>
            <BookingActionButton type="submit" variant="primary" loading={isSubmitting} disabled={isSubmitting}>
              Fortsett til booking
            </BookingActionButton>
          </BookingFooterNav>
        </Form>
      ) : null}
    </Stack>
  );
}

// ---------- shared: avatar circle from a display name ----------

function AvatarInitial({ name }: { name: string | null }) {
  const initial = name?.trim().charAt(0).toUpperCase();
  return (
    <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-booking-action/10 text-lg font-bold text-booking-action">
      {initial || <UserRound className="size-5" />}
    </div>
  );
}

// ---------- RESUME: verified identity — confirmation anatomy, not a bare card ----------

function ResumeCard({
  resumeUser,
  isSubmitting,
}: {
  resumeUser: { displayName: string | null; maskedMobile: string | null } | null;
  isSubmitting: boolean;
}) {
  return (
    <div className={`${CARD_CLASS} overflow-hidden`}>
      <div className="flex items-center justify-between gap-3 border-b border-booking-border bg-booking-action/5 px-4 py-3 md:px-5">
        <Text as="p" variant="caption" className="font-semibold uppercase tracking-wider text-booking-text-muted">
          Din kontaktinformasjon
        </Text>
        <span className="inline-flex items-center gap-1 rounded-full bg-booking-action px-2.5 py-1 text-xs font-semibold text-booking-action-contrast">
          <BadgeCheck className="size-3.5" />
          Bekreftet
        </span>
      </div>

      <div className="flex items-center gap-4 p-4 md:p-5">
        <AvatarInitial name={resumeUser?.displayName ?? null} />
        <div className="min-w-0 flex-1 space-y-0.5">
          <Text as="p" variant="body" className="truncate font-bold text-booking-text">
            {resumeUser?.displayName || 'Bekreftet kontakt'}
          </Text>
          {resumeUser?.maskedMobile ? (
            <span className="inline-flex items-center gap-1.5 text-sm text-booking-text-muted">
              <Phone className="size-3.5" />
              {resumeUser.maskedMobile}
            </span>
          ) : null}
        </div>
        <Form method="post" className="shrink-0">
          <input type="hidden" name="intent" value="clear" readOnly />
          <button
            type="submit"
            disabled={isSubmitting}
            className="text-sm font-semibold text-booking-action hover:underline disabled:opacity-50"
          >
            Endre
          </button>
        </Form>
      </div>
    </div>
  );
}

// ---------- CONTINUE_AS: identity card — who you are, one obvious action ----------

function ContinueAsCard({
  authenticatedUser,
  routes,
  isSubmitting,
}: {
  authenticatedUser: { displayName: string | null } | null;
  routes: ReturnType<typeof getBookingRouteMap>;
  isSubmitting: boolean;
}) {
  const name = authenticatedUser?.displayName || null;
  return (
    <Form method="post" className="space-y-6">
      <input type="hidden" name="intent" value="attach" readOnly />

      <div className={`${CARD_CLASS} p-4 md:p-5`}>
        <div className="flex items-center gap-3">
          <AvatarInitial name={name} />
          <div className="min-w-0 flex-1 space-y-0">
            <Text as="p" variant="body" className="truncate font-bold text-booking-text">
              {name || 'Innlogget bruker'}
            </Text>
            <Text as="p" variant="caption" className="leading-snug text-booking-text-muted">
              Du er logget inn — vi bruker kontaktinformasjonen fra kontoen din.
            </Text>
          </div>
        </div>
        <div className="mt-3 rounded-[var(--radius-booking-control)] bg-booking-action/10 px-3 py-2.5">
          <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-1 text-sm leading-snug text-booking-text-muted">
            <span>Ikke {name || 'deg'}?</span>
            <BookingLink
              to={`${routes.contact}?form=1`}
              variant="inline"
              disabled={isSubmitting}
              className="min-h-0 rounded-md border-booking-action/40 bg-booking-surface-raised/60 px-2 py-1 text-sm no-underline"
            >
              Fortsett som gjest
            </BookingLink>
            <span>eller</span>
            <BookingLink
              to={routes.contactSignIn}
              variant="inline"
              disabled={isSubmitting}
              className="min-h-0 rounded-md border-booking-action/40 bg-booking-surface-raised/60 px-2 py-1 text-sm no-underline"
            >
              logg inn med en annen konto
            </BookingLink>
          </div>
        </div>
      </div>

      <BookingFooterNav>
        <BookingLink to={routes.selectTime} variant="secondary" disabled={isSubmitting}>
          Tilbake
        </BookingLink>
        <BookingActionButton type="submit" variant="primary" loading={isSubmitting} disabled={isSubmitting}>
          {name ? `Fortsett som ${name}` : 'Fortsett'}
        </BookingActionButton>
      </BookingFooterNav>
    </Form>
  );
}

// ---------- FORM: the guest contact form (also rendered for ERROR, with the notice above) ----------

function ContactForm({
  routes,
  isSubmitting,
}: {
  routes: ReturnType<typeof getBookingRouteMap>;
  isSubmitting: boolean;
}) {
  const [showEmail, setShowEmail] = useState(false);

  return (
    <Form method="post" className="space-y-6">
      <input type="hidden" name="intent" value="identify" readOnly />

      <div className={`${CARD_CLASS} space-y-5 p-4 md:p-6`}>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="givenName" className={BOOKING_CONTACT_LABEL_CLASS}>
              Fornavn
            </Label>
            <Input id="givenName" name="givenName" variant="booking" autoComplete="given-name" required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="familyName" className={BOOKING_CONTACT_LABEL_CLASS}>
              Etternavn
            </Label>
            <Input id="familyName" name="familyName" variant="booking" autoComplete="family-name" required />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="mobileNumber" className={BOOKING_CONTACT_LABEL_CLASS}>
            Mobilnummer
          </Label>
          <div className="relative">
            <Phone className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-booking-text-muted" />
            <Input
              id="mobileNumber"
              name="mobileNumber"
              variant="booking"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              maxLength={8}
              required
              className="pl-9"
            />
          </div>
          <Text as="p" variant="caption" className="text-booking-text-muted">
            Vi sender SMS med kode for å bekrefte bestillingen.
          </Text>
        </div>

        {showEmail ? (
          <div className="space-y-2">
            <Label htmlFor="email" className={BOOKING_CONTACT_LABEL_CLASS}>
              E-post <span className="font-normal text-booking-text-muted">(valgfritt)</span>
            </Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-booking-text-muted" />
              <Input
                id="email"
                name="email"
                variant="booking"
                type="email"
                inputMode="email"
                autoComplete="email"
                className="pl-9"
              />
            </div>
            <Text as="p" variant="caption" className="text-booking-text-muted">
              Valgfritt. Vi sender bekreftelsen på e-post også.
            </Text>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowEmail(true)}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-booking-action hover:underline"
          >
            <Plus className="size-4" />
            Legg til e-post (valgfritt)
          </button>
        )}

        {/* Secondary path: one quiet line, clearly separated — never competing with the primary. */}
        <div className="border-t border-booking-border pt-4">
          <Text as="p" variant="caption" className="text-booking-text-muted">
            Har du allerede en konto?{' '}
            <BookingLink to={routes.contactSignIn} variant="inline">
              Logg inn
            </BookingLink>
          </Text>
        </div>
      </div>

      {/* Footer INSIDE the form — the submit needs no form="id" attribute. */}
      <BookingFooterNav>
        <BookingLink to={routes.selectTime} variant="secondary" disabled={isSubmitting}>
          Tilbake
        </BookingLink>
        <BookingActionButton type="submit" variant="primary" loading={isSubmitting} disabled={isSubmitting}>
          {isSubmitting ? 'Sender SMS...' : 'Fortsett til SMS-bekreftelse'}
        </BookingActionButton>
      </BookingFooterNav>
    </Form>
  );
}
