import { data, Form, redirect, useNavigation } from 'react-router';
import type { Route } from './+types/booking.public.appointment.session.contact.collect-mobile.route';
import { Smartphone } from 'lucide-react';
import { ROUTES_MAP } from '~/lib/route-tree';
import { resolveErrorPayload } from '~/lib/api-error';
import { redirectWithError, redirectWithInfo } from '~/lib/flash-message.server';
import { Button, Input, PageHeader, Panel, Stack } from '~/ui';
import { resolveAuthNextStepHref } from '../_utils/auth.utils';
import { resolveMappedAuthError } from '../_utils/auth-step-error';

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

export async function loader({ request }: Route.LoaderArgs) {
  const { AppointmentSessionService } = await import('../../_services/appointment-session.service.server');
  const session = await AppointmentSessionService.get(request);

  if (!session) {
    return redirectWithError(request, ROUTES_MAP['booking.public.appointment'].href, 'Kunne ikke hente session');
  }

  const url = new URL(request.url);
  return data({ session, mobileNumber: url.searchParams.get('mobileNumber') || '' });
}

export async function action({ request }: Route.ActionArgs) {
  let submittedMobileNumber = '';
  try {
    const { AppointmentSessionService } = await import('../../_services/appointment-session.service.server');
    const { ContactAuthService } = await import('../_services/contact-auth.service.server');
    const session = await AppointmentSessionService.get(request);

    if (!session) {
      return redirectWithError(request, ROUTES_MAP['booking.public.appointment'].href, 'Kunne ikke hente session');
    }

    if (!session.userId) {
      return redirectWithError(request, ROUTES_MAP['booking.public.appointment'].href, 'Kunne ikke hente bruker-ID');
    }

    const formData = await request.formData();
    const mobileNumber = String(formData.get('mobileNumber') || '');
    submittedMobileNumber = mobileNumber;
    const retryHref = buildCollectMobileRetryHref(request, mobileNumber);

    const response = await ContactAuthService.completeProfile({
      userId: session.userId,
      mobileNumber,
    });

    const authStatus = await ContactAuthService.getUserStatus(request);
    const nextStepHref = resolveAuthNextStepHref(authStatus?.nextStep ?? response?.nextStep);
    const { verificationCookieHeader } = await ContactAuthService.resolvePostAuthRedirect(response);
    if (verificationCookieHeader) {
      const headers = new Headers();
      headers.append('Set-Cookie', verificationCookieHeader);

      if (nextStepHref) {
        return redirect(nextStepHref, { headers });
      }

      return redirectWithInfo(
        request,
        ROUTES_MAP['booking.public.appointment.session.contact'].href,
        'Kunne ikke logge inn. Prøv igjen.',
        headers,
      );
    }

    if (!response) {
      return redirectWithError(
        request,
        ROUTES_MAP['booking.public.appointment'].href,
        'Kunne ikke lagre mobilnummer. Prøv igjen.',
      );
    }

    if (nextStepHref) {
      return redirect(nextStepHref);
    }

    return redirectWithError(
      request,
      ROUTES_MAP['booking.public.appointment'].href,
      'Kunne ikke lagre mobilnummer. Prøv igjen.',
    );
  } catch (error) {
    const { message } = resolveErrorPayload(error, 'Kunne ikke lagre mobilnummer. Prøv igjen.');
    const mappedMessage = resolveMappedAuthError(error, message);
    const retryHref = buildCollectMobileRetryHref(request, submittedMobileNumber);
    return redirectWithError(request, retryHref, mappedMessage);
  }
}

export default function BookingPublicAppointmentSessionContactAuthCollectMobileRoute({
  loaderData,
}: Route.ComponentProps) {
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';
  return (
    <>
      <Stack space="xl">
        <PageHeader
          label="Kontakt"
          title="Legg til ditt mobilnummer"
          description="Vi trenger ditt mobilnummer for å fullføre booking."
        />

        <Panel title="Mobilnummer" tone="muted">
          <Form method="post" aria-busy={isSubmitting}>
            <Stack space="md">
              <Stack space="xs">
                <Input
                  id="mobileNumber"
                  name="mobileNumber"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  defaultValue={loaderData.mobileNumber || undefined}
                  disabled={isSubmitting}
                />
              </Stack>

              <Button type="submit" size="lg" fullWidth className="gap-3">
                <Smartphone className="size-5" />
                Fortsett
              </Button>
            </Stack>
          </Form>
        </Panel>
      </Stack>
    </>
  );
}
