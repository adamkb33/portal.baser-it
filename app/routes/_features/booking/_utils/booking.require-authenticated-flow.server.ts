import { redirect } from 'react-router';
import type { AppointmentSessionDto } from '~/api/generated/booking';
import { getSession } from '~/lib/appointments.server';
import { resolveAuthNextStepHref } from '~/routes/_features/booking/session/contact/_utils/auth.utils';
import { AppointmentSessionService } from '../_services/booking.appointment-session.service.server';
import { ContactAuthService } from '../session/contact/_services/contact-auth.service.server';
import { getBookingRouteMap } from './booking.route-map';
import type { BookingSurface } from './booking.surface';

type GuardResult = {
  session: AppointmentSessionDto;
};

export async function requireAuthenticatedBookingFlow(
  request: Request,
  surface: BookingSurface = 'public',
): Promise<GuardResult | Response> {
  const routes = getBookingRouteMap(surface);
  const session = await getSession(request);
  if (!session || !session.userId) {
    return redirect(routes.contact);
  }

  const authStatus = await ContactAuthService.getUserStatus(request);
  if (!authStatus) {
    const clearSessionCookie = await AppointmentSessionService.delete(request);
    return redirect(routes.contact, {
      headers: {
        'Set-Cookie': clearSessionCookie,
      },
    });
  }

  if (authStatus.nextStep !== 'DONE') {
    const nextStepHref = resolveAuthNextStepHref(authStatus.nextStep, surface);
    if (nextStepHref) {
      return redirect(nextStepHref);
    }
    return redirect(routes.contact);
  }

  return { session };
}
