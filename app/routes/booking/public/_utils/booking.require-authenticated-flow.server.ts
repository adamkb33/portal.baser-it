import { redirect } from 'react-router';
import type { AppointmentSessionDto } from '~/api/generated/booking';
import { resolveAuthStatusNextStepHref } from '~/routes/booking/public/appointment/session/contact/_utils/auth.utils';
import { AppointmentSessionService } from '../_services/booking.appointment-session.service.server';
import { ContactAuthService } from '../appointment/session/contact/_services/contact-auth.service.server';
import { getBookingRouteMap } from './booking.route-map';

type GuardResult = {
  session: AppointmentSessionDto;
};

export async function requireAuthenticatedBookingFlow(request: Request): Promise<GuardResult | Response> {
  const routes = getBookingRouteMap();
  const sessionResult = await AppointmentSessionService.getResult(request);
  const session = sessionResult.status === 'found' ? sessionResult.session : null;

  if (sessionResult.status === 'stale-cookie') {
    const clearSessionCookie = await AppointmentSessionService.delete(request);
    return redirect(routes.appointment, {
      headers: {
        'Set-Cookie': clearSessionCookie,
      },
    });
  }

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
    const nextStepHref = resolveAuthStatusNextStepHref(authStatus);
    if (nextStepHref && nextStepHref !== routes.employee) {
      return redirect(nextStepHref);
    }
    if (!nextStepHref) {
      return redirect(routes.contact);
    }
  }

  return { session };
}
