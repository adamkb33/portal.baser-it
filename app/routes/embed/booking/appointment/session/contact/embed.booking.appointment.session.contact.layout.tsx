import { Outlet } from 'react-router';
import { createBookingSessionContactLayoutLoader } from '~/routes/_features/booking/session/contact/booking.session.contact.layout.loader';

export const loader = createBookingSessionContactLayoutLoader({ surface: 'embed' });

export default function EmbedBookingAppointmentSessionContactLayout() {
  return <Outlet />;
}
