import { data, Form, redirect, useNavigation } from 'react-router';
import type { Route } from './+types/booking.public.appointment.session.contact.collect-email.route';
import { Mail } from 'lucide-react';
import { ROUTES_MAP } from '~/lib/route-tree';
import { resolveErrorPayload } from '~/lib/api-error';
import { redirectWithError, redirectWithInfo } from '~/lib/flash-message.server';
import { Button, Input, PageHeader, Panel, Stack } from '~/ui';
import { resolveAuthNextStepHref } from '../_utils/auth.utils';
import { resolveMappedAuthError } from '../_utils/auth-step-error';

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

export async function loader({ request }: Route.LoaderArgs) {
  const { AppointmentSessionService } = await import('../../_services/appointment-session.service.server');
  const session = await AppointmentSessionService.get(request);

  if (!session) {
    return redirectWithError(request, ROUTES_MAP['booking.public.appointment'].href, 'Kunne ikke hente session');
  }

  const url = new URL(request.url);
  return data({ session, email: url.searchParams.get('email') || '' });
}

export async function action({ request }: Route.ActionArgs) {
  let submittedEmail = '';
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
    const email = String(formData.get('email') || '');
    submittedEmail = email;
    const retryHref = buildCollectEmailRetryHref(request, email);

    const response = await ContactAuthService.completeProfile({
      userId: session.userId,
      email,
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
      return redirectWithError(request, ROUTES_MAP['booking.public.appointment'].href, 'Kunne ikke lagre e-post.');
    }

    if (nextStepHref) {
      return redirect(nextStepHref);
    }

    return redirectWithError(request, ROUTES_MAP['booking.public.appointment'].href, 'Kunne ikke lagre e-post.');
  } catch (error) {
    const { message } = resolveErrorPayload(error, 'Kunne ikke lagre e-post. Prøv igjen.');
    const mappedMessage = resolveMappedAuthError(error, message);
    const retryHref = buildCollectEmailRetryHref(request, submittedEmail);
    return redirectWithError(request, retryHref, mappedMessage);
  }
}

export default function BookingPublicAppointmentSessionContactAuthCollectEmailRoute({
  loaderData,
}: Route.ComponentProps) {
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';
  return (
    <>
      <Stack space="xl">
        <PageHeader
          label="Kontakt"
          title="Legg til din e-post"
          description="Vi trenger e-posten din for å fullføre booking."
        />

        <Panel title="E-post" tone="muted">
          <Form method="post" aria-busy={isSubmitting}>
            <Stack space="md">
              <Stack space="xs">
                <Input
                  id="email"
                  name="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  defaultValue={loaderData.email || undefined}
                  disabled={isSubmitting}
                />
              </Stack>

              <Button type="submit" size="lg" fullWidth className="gap-3">
                <Mail className="size-5" />
                Fortsett
              </Button>
            </Stack>
          </Form>
        </Panel>
      </Stack>
    </>
  );
}
