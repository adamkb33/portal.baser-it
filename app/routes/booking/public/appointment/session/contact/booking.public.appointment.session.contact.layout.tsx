import { Outlet } from 'react-router';
import { Container } from '~/ui';
import { createBookingSessionContactLayoutLoader } from '~/routes/_features/booking/session/contact/booking.session.contact.layout.loader';

export const loader = createBookingSessionContactLayoutLoader({ surface: 'public' });

export default function BookingPublicAppointmentSessionContactLayout() {
  return (
    <Container size="lg">
      <Outlet />
    </Container>
  );
}
