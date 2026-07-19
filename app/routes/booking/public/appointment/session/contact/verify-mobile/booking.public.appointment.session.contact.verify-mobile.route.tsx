import * as React from 'react';
import { Form, Link, data, redirect, useActionData, useNavigation } from 'react-router';
import { RotateCcw } from 'lucide-react';
import { PublicAppointmentSessionController } from '~/api/generated/booking';
import { withAuth } from '~/api/utils/with-auth';
import { resolveErrorPayload } from '~/lib/api-error';
import { authService } from '~/lib/auth-service';
import { redirectWithError } from '~/lib/flash-message.server';
import { BookingActionButton } from '~/routes/booking/public/_components/booking-action-button';
import { BookingFooterNav } from '~/routes/booking/public/_components/booking-footer-nav';
import { BookingLink } from '~/routes/booking/public/_components/booking-link';
import { withBookingBackendCall, withBookingFlowLog } from '~/routes/booking/public/_utils/booking-flow-log.server';
import { requireBookingSession } from '~/routes/booking/public/_utils/booking.require-authenticated-flow.server';
import { getBookingRouteMap } from '~/routes/booking/public/_utils/booking.route-map';
import { Button, Notice, Stack, Text, VerificationCodeInput } from '~/ui';
import { BOOKING_CONTACT_PAGE_HEADER_CLASS } from '../_utils/booking-contact-theme';
import type { Route } from './+types/booking.public.appointment.session.contact.verify-mobile.route';

type VerifyMobileActionData =
  | {
      ok: false;
      error: string;
    }
  | {
      ok: true;
      message: string;
    };

const CODE_LENGTH = 6;
const ROUTE_ID = 'booking.public.appointment.session.contact.verify-mobile';

export async function loader({ request }: Route.LoaderArgs) {
  return withBookingFlowLog({ request, routeId: ROUTE_ID, kind: 'loader', step: 'verify-mobile' }, async () => {
    const routes = getBookingRouteMap();

    try {
      const guardResult = await requireBookingSession(request);
      if (guardResult instanceof Response) {
        return guardResult;
      }

      const { session } = guardResult;
      const requirementsResponse = await withBookingBackendCall(
        { request, routeId: ROUTE_ID, step: 'verify-mobile', call: 'get-requirements', session },
        () =>
          withAuth(request, () =>
            PublicAppointmentSessionController.getAppointmentSessionRequirements({
              path: { sessionId: session.sessionId },
            }),
          ),
      );
      const requirements = requirementsResponse.data?.data;

      if (!requirements || requirements.nextStep === 'CONTACT_FORM') {
        return redirect(routes.contact);
      }

      if (requirements.nextStep === 'DONE') {
        return redirect(routes.overview);
      }

      if (!requirements.challengeId) {
        return redirectWithError(request, routes.contact, 'Skriv inn mobilnummeret ditt på nytt.');
      }

      return data({
        session,
        requirements,
      });
    } catch (error) {
      const { message } = resolveErrorPayload(error, 'Kunne ikke hente SMS-verifisering');
      return redirectWithError(request, routes.contact, message);
    }
  });
}

export async function action({ request }: Route.ActionArgs) {
  return withBookingFlowLog({ request, routeId: ROUTE_ID, kind: 'action', step: 'verify-mobile' }, async () => {
    const routes = getBookingRouteMap();

    const guardResult = await requireBookingSession(request);
    if (guardResult instanceof Response) {
      return guardResult;
    }

    const { session } = guardResult;
    const formData = await request.formData();
    const intent = String(formData.get('intent') || 'verify');

    // "Endre mobilnummer": the pending guest state lives on the CHALLENGE, not on
    // session.userId — a pending guest has no user to clear, so the clear is
    // best-effort cleanup and must never block the change. The `?form=1` param tells
    // the contact loader to render the form even though the old challenge is still
    // live; submitting the form replaces the challenge on the backend.
    if (intent === 'change-mobile') {
      try {
        await withBookingBackendCall(
          { request, routeId: ROUTE_ID, step: 'verify-mobile', call: 'clear-user', session },
          () =>
            withAuth(request, () =>
              PublicAppointmentSessionController.clearAppointmentSessionUser({
                path: { sessionId: session.sessionId },
              }),
            ),
        );
      } catch {
        // Nothing attached yet — expected for pending guests. The form is still the right place.
      }
      return redirect(`${routes.contact}?form=1`);
    }

    if (intent === 'resend') {
      try {
        await withBookingBackendCall(
          { request, routeId: ROUTE_ID, step: 'verify-mobile', call: 'resend-mobile-challenge', session },
          () =>
            withAuth(request, () =>
              PublicAppointmentSessionController.resendAppointmentSessionMobileChallenge({
                path: { sessionId: session.sessionId },
              }),
            ),
        );
        return data<VerifyMobileActionData>({ ok: true, message: 'Ny SMS-kode er sendt.' });
      } catch (error) {
        const { message } = resolveErrorPayload(error, 'Kunne ikke sende ny SMS');
        return data<VerifyMobileActionData>({ ok: false, error: message }, { status: 400 });
      }
    }

    // Default: verify the code.
    try {
      const challengeId = String(formData.get('challengeId') || '');
      const code = String(formData.get('code') || '').replace(/\D/g, '');

      if (!challengeId || code.length !== CODE_LENGTH) {
        return data<VerifyMobileActionData>({ ok: false, error: 'Skriv inn SMS-koden på 6 siffer.' }, { status: 400 });
      }

      const response = await withBookingBackendCall(
        {
          request,
          routeId: ROUTE_ID,
          step: 'verify-mobile',
          call: 'verify-mobile',
          session,
          context: { hasChallengeId: Boolean(challengeId) },
        },
        () =>
          withAuth(request, () =>
            PublicAppointmentSessionController.verifyAppointmentSessionUserMobile({
              path: { sessionId: session.sessionId },
              body: {
                challengeId,
                code,
              },
            }),
          ),
      );
      const payload = response.data?.data;

      if (!payload || payload.nextStep !== 'DONE') {
        return data<VerifyMobileActionData>(
          { ok: false, error: 'Mobilnummeret ble ikke bekreftet. Prøv igjen.' },
          { status: 400 },
        );
      }

      const headers = await authService.setAuthCookies(
        payload.authTokens.accessToken,
        payload.authTokens.refreshToken,
        payload.authTokens.accessTokenExpiresAt,
        payload.authTokens.refreshTokenExpiresAt,
      );

      return redirect(routes.overview, { headers });
    } catch (error) {
      const { message } = resolveErrorPayload(error, 'Kunne ikke bekrefte SMS-koden');
      return data<VerifyMobileActionData>({ ok: false, error: message }, { status: 400 });
    }
  });
}

export default function BookingContactVerifyMobilePage({ loaderData }: Route.ComponentProps) {
  const actionData = useActionData<typeof action>() as VerifyMobileActionData | undefined;
  const navigation = useNavigation();
  const [code, setCode] = React.useState('');
  const routes = getBookingRouteMap();
  const isSubmitting = navigation.state !== 'idle';
  const submittingIntent = navigation.formData?.get('intent');
  const isVerifyingCode = isSubmitting && submittingIntent === 'verify';
  const isSendingCode = isSubmitting && submittingIntent === 'resend';
  const maskedMobile = loaderData.requirements.maskedMobile || 'mobilnummeret ditt';
  const changeMobileHref = `${routes.contact}?form=1`;

  return (
    <Stack space="xl">
      <div className="mx-auto w-full max-w-2xl space-y-6">
        <div className={BOOKING_CONTACT_PAGE_HEADER_CLASS}>
          <Text as="p" variant="overline" className="text-booking-action">
            SMS
          </Text>
          <Text as="h1" variant="heading-lg" className="text-booking-text">
            Skriv inn SMS-koden
          </Text>
          <Text as="p" variant="body" className="max-w-2xl text-booking-text-muted">
            Vi har sendt en kode til {maskedMobile}. Skriv inn koden for å bekrefte mobilnummeret og fortsette.
          </Text>
        </div>

        {actionData?.ok === false ? (
          <Notice variant="booking" tone="emphasis" title="Kunne ikke bekrefte kode" message={actionData.error} />
        ) : null}
        {actionData?.ok === true ? <Notice variant="booking" title="SMS-kode" message={actionData.message} /> : null}

        {/* THE verify form — wraps the card AND the footer, so no form="id" indirection. */}
        <Form method="post" aria-busy={isVerifyingCode} className="space-y-6">
          <input type="hidden" name="intent" value="verify" />
          <input type="hidden" name="challengeId" value={loaderData.requirements.challengeId} />

          <div className="space-y-5 rounded-[var(--radius-booking-panel)] border-[length:var(--border-booking-card)] border-booking-border bg-booking-surface-raised p-4 shadow-[var(--shadow-booking-card)] md:p-5">
            <VerificationCodeInput
              name="code"
              value={code}
              onChange={setCode}
              length={CODE_LENGTH}
              aria-invalid={actionData?.ok === false}
              disabled={isSubmitting}
              boxClassName="border-booking-border bg-booking-surface-strong text-booking-text data-[active=true]:border-booking-action data-[active=true]:ring-booking-action/25 data-[filled=true]:border-booking-action hover:border-booking-action"
            />

            <div className="flex flex-col gap-2 border-t border-booking-border pt-4 md:flex-row md:items-center md:justify-between">
              {/* Resend is its own tiny form; nesting forms is invalid HTML, so it sits
                  outside via the button's formAction-free sibling pattern below. */}
              <ResendButton isSendingCode={isSendingCode} isSubmitting={isSubmitting} />
              <Link to={changeMobileHref} className="text-sm font-semibold text-booking-action hover:underline">
                Feil nummer? Endre
              </Link>
            </div>
          </div>

          <BookingFooterNav>
            <BookingLink to={changeMobileHref} variant="secondary" disabled={isSubmitting}>
              Endre mobil
            </BookingLink>
            <BookingActionButton
              type="submit"
              variant="primary"
              loading={isVerifyingCode}
              disabled={code.length !== CODE_LENGTH || isSubmitting}
            >
              {isVerifyingCode ? 'Bekrefter...' : 'Bekreft kode'}
            </BookingActionButton>
          </BookingFooterNav>
        </Form>
      </div>
    </Stack>
  );
}

/**
 * Resend must be a separate POST (it has its own intent), but HTML forbids nested
 * forms. A submit button with `formMethod`/`formAction`-style overrides can't change
 * the intent field, so the resend button submits its own form rendered via a portal-free
 * trick: it lives inside the verify form but overrides the submitted intent using
 * name/value on the button itself — the LAST intent value wins in FormData order,
 * so the button carries its own `name="intent" value="resend"`.
 */
function ResendButton({ isSendingCode, isSubmitting }: { isSendingCode: boolean; isSubmitting: boolean }) {
  return (
    <Button
      type="submit"
      name="intent"
      value="resend"
      variant="booking-secondary"
      loading={isSendingCode}
      disabled={isSubmitting}
    >
      <RotateCcw className="size-4" />
      {isSendingCode ? 'Sender SMS...' : 'Send SMS på nytt'}
    </Button>
  );
}
