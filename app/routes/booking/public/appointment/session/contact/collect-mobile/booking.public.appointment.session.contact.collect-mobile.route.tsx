import { createBookingContactCollectMobileAction } from '~/routes/_features/booking/session/contact/collect-mobile/booking.contact.collect-mobile.action';
import { createBookingContactCollectMobileLoader } from '~/routes/_features/booking/session/contact/collect-mobile/booking.contact.collect-mobile.loader';
import { BookingContactCollectMobilePage } from '~/routes/_features/booking/session/contact/collect-mobile/booking.contact.collect-mobile.page';

export const loader = createBookingContactCollectMobileLoader({ surface: 'public' });
export const action = createBookingContactCollectMobileAction({ surface: 'public' });

export default BookingContactCollectMobilePage;
