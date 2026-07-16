import { Form, data, redirect, useNavigation } from 'react-router';
import { ArrowLeft, Mail, Phone, UserRound } from 'lucide-react';
import { PublicAppointmentSessionController } from '~/api/generated/booking';
import { resolveErrorPayload } from '~/lib/api-error';
import { redirectWithError } from '~/lib/flash-message.server';
import { logger } from '~/lib/logger';
import {
  getBookingSessionLogContext,
  withBookingBackendCall,
  withBookingFlowLog,
} from '~/routes/booking/public/_utils/booking-flow-log.server';
import { requireBookingSession } from '~/routes/booking/public/_utils/booking.require-authenticated-flow.server';
import { getBookingRouteMap } from '~/routes/booking/public/_utils/booking.route-map';
import { BookingBottomActionBar } from '~/routes/booking/public/_components/bottom-nav';
import { Button, Input, Label, Notice, Stack, Text } from '~/ui';
import { submitContactFormSchema } from './_schemas/submit-contact.form.schema';
import { BOOKING_CONTACT_LABEL_CLASS, BOOKING_CONTACT_PAGE_HEADER_CLASS } from './_utils/booking-contact-theme';
import type { Route } from './+types/booking.public.appointment.session.contact.route';

const ROUTE_ID = 'booking.public.appointment.session.contact';

export async function loader({ request }: Route.LoaderArgs) {
  return withBookingFlowLog({ request, routeId: ROUTE_ID, kind: 'loader', step: 'contact' }, async () => {
    return contactLoader({ request } as Route.LoaderArgs);
  });
}

async function contactLoader({ request }: Route.LoaderArgs) {
  const routes = getBookingRouteMap();

  try {
    const guardResult = await requireBookingSession(request);
    if (guardResult instanceof Response) {
      return guardResult;
    }

    const { session } = guardResult;
    const requirementsResponse = await withBookingBackendCall(
      { request, routeId: ROUTE_ID, step: 'contact', call: 'get-requirements', session },
      () =>
        PublicAppointmentSessionController.getAppointmentSessionRequirements({
          path: { sessionId: session.sessionId },
        }),
    );
    const requirements = requirementsResponse.data?.data;
    logger.info('[booking:contact:requirements] Resolved', {
      ...getBookingSessionLogContext(session),
      nextStep: requirements?.nextStep ?? null,
      hasRequirements: Boolean(requirements),
    });

    if (requirements?.nextStep === 'VERIFY_MOBILE') {
      logger.info('[booking:contact:requirements] Redirecting', {
        ...getBookingSessionLogContext(session),
        nextStep: requirements.nextStep,
        redirectTo: routes.contactVerifyMobile,
      });
      return redirect(routes.contactVerifyMobile);
    }

    if (requirements?.nextStep === 'DONE') {
      logger.info('[booking:contact:requirements] Redirecting', {
        ...getBookingSessionLogContext(session),
        nextStep: requirements.nextStep,
        redirectTo: routes.overview,
      });
      return redirect(routes.overview);
    }

    logger.info('[booking:contact:requirements] Rendering contact form', {
      ...getBookingSessionLogContext(session),
      nextStep: requirements?.nextStep ?? null,
    });

    return data({
      session,
      requirements,
      requirementsError: null as string | null,
      navigation: {
        selectTime: routes.selectTime,
      },
    });
  } catch (error) {
    const { message } = resolveErrorPayload(error, 'Kunne ikke hente kontaktsteget');
    return data({
      session: null,
      requirements: null,
      requirementsError: message,
      navigation: {
        selectTime: routes.selectTime,
      },
    });
  }
}

export async function action({ request }: Route.ActionArgs) {
  return withBookingFlowLog({ request, routeId: ROUTE_ID, kind: 'action', step: 'contact' }, async () => {
    return contactAction({ request } as Route.ActionArgs);
  });
}

async function contactAction({ request }: Route.ActionArgs) {
  const routes = getBookingRouteMap();

  try {
    const guardResult = await requireBookingSession(request);
    if (guardResult instanceof Response) {
      return guardResult;
    }

    const { session } = guardResult;
    const formData = await request.formData();
    const parsed = submitContactFormSchema.safeParse({
      companyId: session.companyId,
      givenName: String(formData.get('givenName') || ''),
      familyName: String(formData.get('familyName') || ''),
      mobileNumber: String(formData.get('mobileNumber') || ''),
      email: String(formData.get('email') || ''),
    });

    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message || 'Kontroller kontaktinformasjonen og prøv igjen.';
      return data({ error: firstError }, { status: 400 });
    }

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
        PublicAppointmentSessionController.identifyAppointmentSessionUser({
          path: { sessionId: session.sessionId },
          body: {
            givenName: parsed.data.givenName,
            familyName: parsed.data.familyName,
            mobileNumber: parsed.data.mobileNumber,
            email: parsed.data.email,
          },
        }),
    );

    const nextStep = response.data?.data?.nextStep;
    if (nextStep === 'DONE') {
      return redirect(routes.overview);
    }

    return redirect(routes.contactVerifyMobile);
  } catch (error) {
    const { message } = resolveErrorPayload(error, 'Kunne ikke lagre kontaktinformasjon');
    return data({ error: message }, { status: 400 });
  }
}

export default function BookingSessionContactPage({ loaderData, actionData }: Route.ComponentProps) {
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';
  const errorMessage =
    actionData && typeof actionData === 'object' && 'error' in actionData ? String(actionData.error) : null;
  const contactFormId = 'booking-contact-form';

  return (
    <Stack space="xl">
      <div className={BOOKING_CONTACT_PAGE_HEADER_CLASS}>
        <Text as="p" variant="overline" className="text-booking-action">
          Kontakt
        </Text>
        <Text as="h1" variant="heading-lg" className="text-booking-text">
          Hvem skal vi sende bekreftelsen til?
        </Text>
        <Text as="p" variant="body" className="max-w-2xl text-booking-text-muted">
          Vi sender en SMS-kode til mobilnummeret ditt før timen bekreftes. E-post er valgfritt.
        </Text>
      </div>

      {errorMessage ? (
        <Notice variant="booking" tone="emphasis" title="Kunne ikke fortsette" message={errorMessage} />
      ) : null}
      {loaderData.requirementsError ? (
        <Notice
          variant="booking"
          tone="emphasis"
          title="Kunne ikke hente bookingstatus"
          message="Prøv igjen om litt. Kontaktinformasjonen din kan fortsatt fylles ut."
        />
      ) : null}

      <Form
        id={contactFormId}
        method="post"
        className="space-y-5 rounded-[var(--radius-booking-panel)] border-[length:var(--border-booking-card)] border-booking-border bg-booking-surface-raised p-4 shadow-[var(--shadow-booking-card)] md:p-5"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="givenName" className={BOOKING_CONTACT_LABEL_CLASS}>
              Fornavn
            </Label>
            <div className="relative">
              <UserRound className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-booking-text-muted" />
              <Input
                id="givenName"
                name="givenName"
                variant="booking"
                autoComplete="given-name"
                required
                className="pl-9"
              />
            </div>
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
            Legg inn e-post hvis du også vil motta bekreftelse der.
          </Text>
        </div>

        <div className="hidden md:block">
          <Button type="submit" variant="booking-primary" loading={isSubmitting} disabled={isSubmitting}>
            {isSubmitting ? 'Sender SMS...' : 'Fortsett'}
          </Button>
        </div>
      </Form>

      <BookingBottomActionBar
        actions={[
          {
            id: 'back',
            label: 'Tilbake',
            to: loaderData.navigation.selectTime,
            icon: <ArrowLeft className="size-4" />,
            variant: 'secondary',
          },
          {
            id: 'continue',
            label: isSubmitting ? 'Sender SMS...' : 'Fortsett',
            type: 'button',
            buttonType: 'submit',
            form: contactFormId,
            variant: 'primary',
            loading: isSubmitting,
            disabled: isSubmitting,
          },
        ]}
      />
    </Stack>
  );
}
