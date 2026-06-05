import { createBookingSessionContactAction } from '~/routes/_features/booking/session/contact/booking.session.contact.action';
import { createBookingSessionContactLoader } from '~/routes/_features/booking/session/contact/booking.session.contact.loader';
import { BookingSessionContactPage } from '~/routes/_features/booking/session/contact/booking.session.contact.page';

export const loader = createBookingSessionContactLoader({ surface: 'public' });

export const action = createBookingSessionContactAction({ surface: 'public' });

export default BookingSessionContactPage;
