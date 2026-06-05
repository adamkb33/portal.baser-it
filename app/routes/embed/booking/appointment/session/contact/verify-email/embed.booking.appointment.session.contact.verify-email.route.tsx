import { createBookingContactVerifyEmailLoader } from '~/routes/_features/booking/session/contact/verify-email/booking.contact.verify-email.loader';
import {
  BookingContactVerifyEmailPage,
  handle,
} from '~/routes/_features/booking/session/contact/verify-email/booking.contact.verify-email.page';

export { handle };

export const loader = createBookingContactVerifyEmailLoader({ surface: 'embed' });

export default BookingContactVerifyEmailPage;
