import { redirect, type ActionFunctionArgs } from 'react-router';
import { resolveErrorPayload } from '~/lib/api-error';
import { redirectWithError, redirectWithInfo } from '~/lib/flash-message.server';
import { AppointmentSessionService } from '../../../_services/booking.appointment-session.service.server';
import { getBookingRouteMap } from '../../../_utils/booking.route-map';
import type { BookingSurface } from '../../../_utils/booking.surface';
import { ContactAuthService } from '../_services/contact-auth.service.server';
import { resolveMappedAuthError } from '../_utils/auth-step-error';
import { resolveAuthNextStepHref } from '../_utils/auth.utils';

type CreateBookingContactCollectMobileActionOptions = {
  surface: BookingSurface;
};

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

export function createBookingContactCollectMobileAction({ surface }: CreateBookingContactCollectMobileActionOptions) {
  return async function bookingContactCollectMobileAction({ request }: ActionFunctionArgs) {
    const routes = getBookingRouteMap(surface);
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
      const response = await ContactAuthService.completeProfile({
        userId: session.userId,
        mobileNumber,
      });

      const authStatus = await ContactAuthService.getUserStatus(request);
      const nextStepHref = resolveAuthNextStepHref(authStatus?.nextStep ?? response?.nextStep, surface);
      const { verificationCookieHeader } = await ContactAuthService.resolvePostAuthRedirect(response, { surface });
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
  };
}
