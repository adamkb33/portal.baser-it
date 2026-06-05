import { createBookingContactSignInAction } from '~/routes/_features/booking/session/contact/sign-in/booking.contact.sign-in.action';
import { createBookingContactSignInLoader } from '~/routes/_features/booking/session/contact/sign-in/booking.contact.sign-in.loader';
import { BookingContactSignInPage } from '~/routes/_features/booking/session/contact/sign-in/booking.contact.sign-in.page';

export const loader = createBookingContactSignInLoader({ surface: 'public' });
export const action = createBookingContactSignInAction({ surface: 'public' });

export default BookingContactSignInPage;
