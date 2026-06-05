import { createBookingContactCollectEmailAction } from '~/routes/_features/booking/session/contact/collect-email/booking.contact.collect-email.action';
import { createBookingContactCollectEmailLoader } from '~/routes/_features/booking/session/contact/collect-email/booking.contact.collect-email.loader';
import { BookingContactCollectEmailPage } from '~/routes/_features/booking/session/contact/collect-email/booking.contact.collect-email.page';

export const loader = createBookingContactCollectEmailLoader({ surface: 'public' });
export const action = createBookingContactCollectEmailAction({ surface: 'public' });

export default BookingContactCollectEmailPage;
