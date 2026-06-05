import { createBookingContactVerifyMobileLoader } from '~/routes/_features/booking/session/contact/verify-mobile/booking.contact.verify-mobile.loader';
import { BookingContactVerifyMobilePage } from '~/routes/_features/booking/session/contact/verify-mobile/booking.contact.verify-mobile.page';

export const loader = createBookingContactVerifyMobileLoader({ surface: 'embed' });

export default BookingContactVerifyMobilePage;
