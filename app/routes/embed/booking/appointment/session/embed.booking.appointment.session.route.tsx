import { createBookingSessionLoader } from '~/routes/_features/booking/session/booking.session.loader';
import { BookingSessionPage } from '~/routes/_features/booking/session/booking.session.page';

export const loader = createBookingSessionLoader({ surface: 'embed' });

export default BookingSessionPage;
