import * as React from 'react';
import { Form, data, redirect, useActionData, useNavigation } from 'react-router';
import { ArrowLeft, RotateCcw } from 'lucide-react';
import { PublicAppointmentSessionController } from '~/api/generated/booking';
import { resolveErrorPayload } from '~/lib/api-error';
import { authService } from '~/lib/auth-service';
import { redirectWithError } from '~/lib/flash-message.server';
import { requireBookingSession } from '~/routes/booking/public/_utils/booking.require-authenticated-flow.server';
import { getBookingRouteMap } from '~/routes/booking/public/_utils/booking.route-map';
import { BookingBottomActionBar } from '~/routes/booking/public/_components/bottom-nav';
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

export async function loader({ request }: Route.LoaderArgs) {
  const routes = getBookingRouteMap();

  try {
    const guardResult = await requireBookingSession(request);
    if (guardResult instanceof Response) {
      return guardResult;
    }

    const { session } = guardResult;
    const requirementsResponse = await PublicAppointmentSessionController.getAppointmentSessionRequirements({
      path: { sessionId: session.sessionId },
    });
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
      navigation: {
        contact: routes.contact,
        overview: routes.overview,
      },
    });
  } catch (error) {
    const { message } = resolveErrorPayload(error, 'Kunne ikke hente SMS-verifisering');
    return redirectWithError(request, routes.contact, message);
  }
}

export async function action({ request }: Route.ActionArgs) {
  const routes = getBookingRouteMap();

  try {
    const guardResult = await requireBookingSession(request);
    if (guardResult instanceof Response) {
      return guardResult;
    }

    const { session } = guardResult;
    const formData = await request.formData();
    const intent = String(formData.get('intent') || 'verify');

    if (intent === 'change-mobile') {
      await PublicAppointmentSessionController.clearAppointmentSessionUser({
        path: { sessionId: session.sessionId },
      });
      return redirect(routes.contact);
    }

    if (intent === 'resend') {
      await PublicAppointmentSessionController.resendAppointmentSessionMobileChallenge({
        path: { sessionId: session.sessionId },
      });
      return data<VerifyMobileActionData>({ ok: true, message: 'Ny SMS-kode er sendt.' });
    }

    const challengeId = String(formData.get('challengeId') || '');
    const code = String(formData.get('code') || '').replace(/\D/g, '');

    if (!challengeId || code.length !== CODE_LENGTH) {
      return data<VerifyMobileActionData>({ ok: false, error: 'Skriv inn SMS-koden på 6 siffer.' }, { status: 400 });
    }

    const response = await PublicAppointmentSessionController.verifyAppointmentSessionUserMobile({
      path: { sessionId: session.sessionId },
      body: {
        challengeId,
        code,
      },
    });
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
}

export default function BookingContactVerifyMobilePage({ loaderData }: Route.ComponentProps) {
  const actionData = useActionData<typeof action>() as VerifyMobileActionData | undefined;
  const navigation = useNavigation();
  const [code, setCode] = React.useState('');
  const isSubmitting = navigation.state === 'submitting';
  const submittingIntent = navigation.formData?.get('intent');
  const isVerifyingCode = isSubmitting && submittingIntent !== 'resend' && submittingIntent !== 'change-mobile';
  const isSendingCode = isSubmitting && submittingIntent === 'resend';
  const verifyFormId = 'booking-mobile-verify-form';
  const changeMobileFormId = 'booking-change-mobile-form';
  const resendFormId = 'booking-mobile-resend-form';
  const maskedMobile = loaderData.requirements.maskedMobile || 'mobilnummeret ditt';

  return (
    <Stack space="xl">
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

      <div className="space-y-5 rounded-[var(--radius-booking-panel)] border-[length:var(--border-booking-card)] border-booking-border bg-booking-surface-raised p-4 shadow-[var(--shadow-booking-card)] md:p-5">
        <Form id={verifyFormId} method="post" aria-busy={isVerifyingCode}>
          <Stack space="md">
            <input type="hidden" name="intent" value="verify" />
            <input type="hidden" name="challengeId" value={loaderData.requirements.challengeId} />
            <VerificationCodeInput
              name="code"
              value={code}
              onChange={setCode}
              length={CODE_LENGTH}
              aria-invalid={actionData?.ok === false}
              disabled={isSubmitting}
              boxClassName="border-booking-border bg-booking-surface-strong text-booking-text data-[active=true]:border-booking-action data-[active=true]:ring-booking-action/25 data-[filled=true]:border-booking-action hover:border-booking-action"
            />
            <div className="hidden md:block">
              <Button
                type="submit"
                variant="booking-primary"
                loading={isVerifyingCode}
                disabled={code.length !== CODE_LENGTH || isSubmitting}
              >
                {isVerifyingCode ? 'Bekrefter...' : 'Bekreft kode'}
              </Button>
            </div>
          </Stack>
        </Form>

        <div className="grid gap-2 md:grid-cols-2">
          <Form id={resendFormId} method="post">
            <input type="hidden" name="intent" value="resend" />
            <Button type="submit" variant="booking-secondary" fullWidth loading={isSendingCode} disabled={isSubmitting}>
              <RotateCcw className="size-4" />
              {isSendingCode ? 'Sender SMS...' : 'Send SMS på nytt'}
            </Button>
          </Form>

          <Form id={changeMobileFormId} method="post">
            <input type="hidden" name="intent" value="change-mobile" />
            <Button type="submit" variant="booking-ghost" fullWidth disabled={isSubmitting}>
              Endre mobilnummer
            </Button>
          </Form>
        </div>
      </div>

      <BookingBottomActionBar
        actions={[
          {
            id: 'change-mobile',
            label: 'Endre mobil',
            type: 'button',
            buttonType: 'submit',
            form: changeMobileFormId,
            icon: <ArrowLeft className="size-4" />,
            variant: 'secondary',
            disabled: isSubmitting,
          },
          {
            id: 'verify',
            label: isVerifyingCode ? 'Bekrefter...' : 'Bekreft',
            type: 'button',
            buttonType: 'submit',
            form: verifyFormId,
            variant: 'primary',
            loading: isVerifyingCode,
            disabled: code.length !== CODE_LENGTH || isSubmitting,
          },
        ]}
      />
    </Stack>
  );
}
