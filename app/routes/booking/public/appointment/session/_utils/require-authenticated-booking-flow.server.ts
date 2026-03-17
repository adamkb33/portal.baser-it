import { redirect } from 'react-router';
import type { AppointmentSessionDto } from '~/api/generated/booking';
import { getSession } from '~/lib/appointments.server';
import { ROUTES_MAP } from '~/lib/route-tree';
import { ContactAuthService } from '../contact/_services/contact-auth.service.server';
import { resolveAuthNextStepHref } from '../contact/_utils/auth.utils';
import { AppointmentSessionService } from '../_services/appointment-session.service.server';

type GuardResult = {
  session: AppointmentSessionDto;
};

export async function requireAuthenticatedBookingFlow(request: Request): Promise<GuardResult | Response> {
  const session = await getSession(request);
  if (!session || !session.userId) {
    return redirect(ROUTES_MAP['booking.public.appointment.session.contact'].href);
  }

  const authStatus = await ContactAuthService.getUserStatus(request);
  if (!authStatus) {
    const clearSessionCookie = await AppointmentSessionService.delete(request);
    return redirect(ROUTES_MAP['booking.public.appointment.session.contact'].href, {
      headers: {
        'Set-Cookie': clearSessionCookie,
      },
    });
  }

  if (authStatus.nextStep !== 'DONE') {
    const nextStepHref = resolveAuthNextStepHref(authStatus.nextStep);
    if (nextStepHref) {
      return redirect(nextStepHref);
    }
    return redirect(ROUTES_MAP['booking.public.appointment.session.contact'].href);
  }

  return { session };
}
