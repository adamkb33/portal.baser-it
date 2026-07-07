import { Form, Link, data, redirect, useNavigation } from 'react-router';
import { ChevronLeft, Mail } from 'lucide-react';
import { resolveErrorPayload } from '~/lib/api-error';
import { redirectWithError, redirectWithInfo } from '~/lib/flash-message.server';
import { getBookingRouteMap } from '~/routes/booking/public/_utils/booking.route-map';
import { AppointmentSessionService } from '~/routes/booking/public/_services/booking.appointment-session.service.server';
import { Button, Input, PageHeader, Panel, Stack } from '~/ui';
import type { Route } from './+types/booking.public.appointment.session.contact.collect-email.route';
import { ContactAuthService } from '../_services/contact-auth.service.server';
import { resolveMappedAuthError } from '../_utils/auth-step-error';
import { BOOKING_CONTACT_PAGE_HEADER_CLASS, BOOKING_CONTACT_PANEL_CLASS } from '../_utils/booking-contact-theme';

export async function loader({ request }: Route.LoaderArgs) {
  const routes = getBookingRouteMap();
  const session = await AppointmentSessionService.get(request);

  if (!session) {
    return redirectWithError(request, routes.appointment, 'Kunne ikke hente session');
  }

  const url = new URL(request.url);
  return data({ session, email: url.searchParams.get('email') || '', contactHref: routes.contact });
}

export async function action({ request }: Route.ActionArgs) {
  const routes = getBookingRouteMap();
  let submittedEmail = '';
  try {
    const session = await AppointmentSessionService.get(request);

    if (!session) {
      return redirectWithError(request, routes.appointment, 'Kunne ikke hente session');
    }

    if (!session.userId) {
      return redirectWithError(request, routes.appointment, 'Kunne ikke hente bruker-ID');
    }

    const formData = await request.formData();
    const email = String(formData.get('email') || '');
    submittedEmail = email;

    if (!email.trim()) {
      return redirect(routes.employee);
    }

    const response = await ContactAuthService.completeProfile({
      userId: session.userId,
      email: email.trim(),
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
      return redirectWithError(request, routes.appointment, 'Kunne ikke lagre e-post.');
    }

    if (nextStepHref) {
      return redirect(nextStepHref);
    }

    return redirectWithError(request, routes.appointment, 'Kunne ikke lagre e-post.');
  } catch (error) {
    const { message } = resolveErrorPayload(error, 'Kunne ikke lagre e-post. Prøv igjen.');
    const mappedMessage = resolveMappedAuthError(error, message);
    const retryHref = buildCollectEmailRetryHref(request, submittedEmail);
    return redirectWithError(request, retryHref, mappedMessage);
  }
}

function buildCollectEmailRetryHref(request: Request, email: string): string {
  const currentUrl = new URL(request.url);
  const retryUrl = new URL(`${currentUrl.pathname}${currentUrl.search}`, currentUrl.origin);
  if (email) {
    retryUrl.searchParams.set('email', email);
  } else {
    retryUrl.searchParams.delete('email');
  }
  return `${retryUrl.pathname}${retryUrl.search}`;
}

export default function BookingContactCollectEmailPage({ loaderData }: Route.ComponentProps) {
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';

  return (
    <Stack space="xl">
      <PageHeader
        label="Kontakt"
        title="Legg til e-post"
        description="E-post er valgfritt. Du kan fortsette uten e-post hvis mobilnummeret ditt er bekreftet."
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

      <Panel title="E-post" tone="muted" className={BOOKING_CONTACT_PANEL_CLASS}>
        <Form method="post" aria-busy={isSubmitting}>
          <Stack space="md">
            <Stack space="xs">
              <Input
                id="email"
                name="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="E-post (valgfritt)"
                defaultValue={loaderData.email || undefined}
                disabled={isSubmitting}
                variant="booking"
              />
            </Stack>

            <Button type="submit" size="lg" fullWidth variant="booking-primary" className="gap-3">
              <Mail className="size-5" />
              Lagre og fortsett
            </Button>
          </Stack>
        </Form>
      </Panel>
    </Stack>
  );
}
