import { redirect } from 'react-router';
import { redirectWithError } from '~/lib/flash-message.server';
import { resolveErrorPayload } from '~/lib/api-error';
import { redirectAuthStatusNextStepHref } from '../_utils/auth.utils';
import { ContactAuthService } from '../_services/contact-auth.service.server';
import { getBookingRouteMap } from '~/routes/booking/public/_utils/booking.route-map';
import { AppointmentSessionService } from '~/routes/booking/public/_services/booking.appointment-session.service.server';
import type { Route } from './+types/booking.public.appointment.session.contact.verify-email.route';

export const handle = {
  contactFlow: true,
} as const;

export async function loader({ request }: Route.LoaderArgs) {
  const routes = getBookingRouteMap();

  try {
    const session = await AppointmentSessionService.get(request);

    if (!session || !session.userId) {
      return redirect(routes.session);
    }

    const authStatus = await ContactAuthService.getUserStatus(request);
    if (!authStatus) {
      return redirect(routes.session);
    }

    return redirectAuthStatusNextStepHref(authStatus);
  } catch (error) {
    const { message } = resolveErrorPayload(error, 'Kunne ikke hente brukerdata');
    return redirectWithError(request, routes.session, message);
  }
}

export default function BookingContactVerifyEmailPage() {
  return null;
}
