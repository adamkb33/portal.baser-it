import { redirect, type ActionFunctionArgs } from 'react-router';
import { resolveErrorPayload } from '~/lib/api-error';
import { redirectWithError, redirectWithInfo } from '~/lib/flash-message.server';
import { AppointmentSessionService } from '../../../_services/booking.appointment-session.service.server';
import { getBookingRouteMap } from '../../../_utils/booking.route-map';
import type { BookingSurface } from '../../../_utils/booking.surface';
import { ContactAuthService } from '../_services/contact-auth.service.server';
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

type CreateBookingContactCollectEmailActionOptions = {
  surface: BookingSurface;
};

export function createBookingContactCollectEmailAction({ surface }: CreateBookingContactCollectEmailActionOptions) {
  return async function bookingContactCollectEmailAction({ request }: ActionFunctionArgs) {
    const routes = getBookingRouteMap(surface);
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
      const retryHref = buildCollectEmailRetryHref(request, email);

      if (!email.trim()) {
        return redirect(routes.employee);
      }

      const response = await ContactAuthService.completeProfile({
        userId: session.userId,
        email: email.trim(),
      });

      const { nextStepHref, verificationCookieHeader } = await ContactAuthService.resolvePostAuthRedirect(response, { surface });
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
  };
}
