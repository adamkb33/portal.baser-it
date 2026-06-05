import { createBookingContactSignInAction } from '~/routes/_features/booking/session/contact/sign-in/booking.contact.sign-in.action';
import { createBookingContactSignInLoader } from '~/routes/_features/booking/session/contact/sign-in/booking.contact.sign-in.loader';
import { BookingContactSignInPage } from '~/routes/_features/booking/session/contact/sign-in/booking.contact.sign-in.page';

export const loader = createBookingContactSignInLoader({ surface: 'embed' });
export const action = createBookingContactSignInAction({ surface: 'embed' });

export default BookingContactSignInPage;
