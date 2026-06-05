import { createBookingContactSignUpAction } from '~/routes/_features/booking/session/contact/sign-up/booking.contact.sign-up.action';
import { createBookingContactSignUpLoader } from '~/routes/_features/booking/session/contact/sign-up/booking.contact.sign-up.loader';
import { BookingContactSignUpPage } from '~/routes/_features/booking/session/contact/sign-up/booking.contact.sign-up.page';

export const loader = createBookingContactSignUpLoader({ surface: 'embed' });
export const action = createBookingContactSignUpAction({ surface: 'embed' });

export default BookingContactSignUpPage;
