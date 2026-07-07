import { Form, Link, data, redirect, useNavigation } from 'react-router';
import { ChevronLeft, Smartphone } from 'lucide-react';
import { resolveErrorPayload } from '~/lib/api-error';
import { redirectWithError, redirectWithInfo } from '~/lib/flash-message.server';
import { getBookingRouteMap } from '~/routes/booking/public/_utils/booking.route-map';
import { AppointmentSessionService } from '~/routes/booking/public/_services/booking.appointment-session.service.server';
import { Button, Input, Label, PageHeader, Panel, Stack, Text } from '~/ui';
import type { Route } from './+types/booking.public.appointment.session.contact.collect-mobile.route';
import { ContactAuthService } from '../_services/contact-auth.service.server';
import { resolveMappedAuthError } from '../_utils/auth-step-error';
import {
  BOOKING_CONTACT_LABEL_CLASS,
  BOOKING_CONTACT_PAGE_HEADER_CLASS,
  BOOKING_CONTACT_PANEL_CLASS,
} from '../_utils/booking-contact-theme';

export async function loader({ request }: Route.LoaderArgs) {
  const routes = getBookingRouteMap();
  const session = await AppointmentSessionService.get(request);

  if (!session) {
    return redirectWithError(request, routes.appointment, 'Kunne ikke hente session');
  }

  const url = new URL(request.url);
  return data({ session, mobileNumber: url.searchParams.get('mobileNumber') || '', contactHref: routes.contact });
}

export async function action({ request }: Route.ActionArgs) {
  const routes = getBookingRouteMap();
  let submittedMobileNumber = '';
  try {
    const session = await AppointmentSessionService.get(request);

    if (!session) {
      return redirectWithError(request, routes.appointment, 'Kunne ikke hente session');
    }

    if (!session.userId) {
      return redirectWithError(request, routes.appointment, 'Kunne ikke hente bruker-ID');
    }

    const formData = await request.formData();
    const mobileNumber = String(formData.get('mobileNumber') || '');
    submittedMobileNumber = mobileNumber;

    if (!mobileNumber.trim()) {
      return redirectWithError(
        request,
        buildCollectMobileRetryHref(request, mobileNumber),
        'Mobilnummer er påkrevd for å bestille time.',
      );
    }

    const response = await ContactAuthService.completeProfile({
      userId: session.userId,
      mobileNumber: mobileNumber.trim(),
    });

    const { nextStepHref, verificationCookieHeader } = await ContactAuthService.resolvePostAuthRedirect(response);
    if (verificationCookieHeader) {
      const headers = new Headers();
      headers.append('Set-Cookie', verificationCookieHeader);

      if (nextStepHref) {
        return redirect(nextStepHref, { headers });
      }

      return redirectWithInfo(request, routes.contact, 'Kunne ikke logge inn. Prøv igjen.', headers);
    }

    if (!response) {
      return redirectWithError(request, routes.appointment, 'Kunne ikke lagre mobilnummer. Prøv igjen.');
    }

    if (nextStepHref) {
      return redirect(nextStepHref);
    }

    return redirectWithError(request, routes.appointment, 'Kunne ikke lagre mobilnummer. Prøv igjen.');
  } catch (error) {
    const { message } = resolveErrorPayload(error, 'Kunne ikke lagre mobilnummer. Prøv igjen.');
    const mappedMessage = resolveMappedAuthError(error, message);
    const retryHref = buildCollectMobileRetryHref(request, submittedMobileNumber);
    return redirectWithError(request, retryHref, mappedMessage);
  }
}

function buildCollectMobileRetryHref(request: Request, mobileNumber: string): string {
  const currentUrl = new URL(request.url);
  const retryUrl = new URL(`${currentUrl.pathname}${currentUrl.search}`, currentUrl.origin);
  if (mobileNumber) {
    retryUrl.searchParams.set('mobileNumber', mobileNumber);
  } else {
    retryUrl.searchParams.delete('mobileNumber');
  }
  return `${retryUrl.pathname}${retryUrl.search}`;
}

export default function BookingContactCollectMobilePage({ loaderData }: Route.ComponentProps) {
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';

  return (
    <Stack space="xl">
      <PageHeader
        label="Kontakt"
        title="Legg til ditt mobilnummer"
        description="Mobilnummer er påkrevd for å bestille time."
        className={BOOKING_CONTACT_PAGE_HEADER_CLASS}
      />
      <div>
        <Link
          to={loaderData.contactHref}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-booking-text-muted hover:text-booking-text"
        >
          <ChevronLeft className="size-4" />
          Tilbake til kontakt
        </Link>
      </div>

      <Panel title="Mobilnummer" tone="muted" className={BOOKING_CONTACT_PANEL_CLASS}>
        <Form method="post" aria-busy={isSubmitting}>
          <Stack space="md">
            <Stack space="xs">
              <Label htmlFor="mobileNumber" className={BOOKING_CONTACT_LABEL_CLASS}>
                Mobilnummer
              </Label>
              <Input
                id="mobileNumber"
                name="mobileNumber"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                required
                defaultValue={loaderData.mobileNumber || undefined}
                disabled={isSubmitting}
                variant="booking"
              />
              <Text as="p" variant="caption" className="text-booking-text-muted">
                Vi bruker mobilnummeret ditt til å bekrefte bestillingen og sende viktig informasjon om timen.
              </Text>
            </Stack>

            <Button type="submit" size="lg" fullWidth variant="booking-primary" className="gap-3">
              <Smartphone className="size-5" />
              Fortsett
            </Button>
          </Stack>
        </Form>
      </Panel>
    </Stack>
  );
}
