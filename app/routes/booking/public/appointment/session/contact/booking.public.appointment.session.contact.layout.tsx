import { data, Outlet } from 'react-router';
import { Container } from '~/ui';
import { getBookingRouteMap } from '~/routes/booking/public/_utils/booking.route-map';
import type { Route } from './+types/booking.public.appointment.session.contact.layout';
import { ContactSessionService } from './_services/contact-session.service.server';
import { AppointmentSessionService } from '~/routes/booking/public/_services/booking.appointment-session.service.server';
import { redirectWithError } from '~/lib/flash-message.server';
import { resolveErrorPayload } from '~/lib/api-error';
import { BookingCompanyBadge } from '~/routes/booking/public/_components/booking-company-badge';
import { getBookingCompanySummary } from '~/routes/booking/public/_utils/booking-company.server';

export async function loader({ request }: Route.LoaderArgs) {
  const routes = getBookingRouteMap();

  try {
    const { session, sessionStatus, sessionUser, auth, verificationSessionToken } =
      await ContactSessionService.getContactContext(request);

    if (!session) {
      if (sessionStatus === 'stale-cookie') {
        const clearSessionCookie = await AppointmentSessionService.delete(request);
        return redirectWithError(request, routes.appointment, 'Bookingøkten er utløpt. Start på nytt.', {
          'Set-Cookie': clearSessionCookie,
        });
      }

      return redirectWithError(request, routes.session, 'Kunne ikke hente session');
    }

    const companySummary = await getBookingCompanySummary(session.companyId);

    return data({
      session,
      sessionUser,
      auth,
      verificationSessionToken,
      companySummary,
    });
  } catch (error) {
    const { message } = resolveErrorPayload(error, 'Kunne ikke hente session');
    console.error('[contact.layout] Loader failed', { message, error });
    return redirectWithError(request, routes.session, message);
  }
}

export default function BookingPublicAppointmentSessionContactLayout({ loaderData }: Route.ComponentProps) {
  return (
    <Container size="lg">
      <BookingCompanyBadge company={loaderData.companySummary} className="mb-4" />
      <Outlet />
    </Container>
  );
}
