import { createBookingSelectTimeAction } from '~/routes/_features/booking/session/select-time/booking.select-time.action';
import { createBookingSelectTimeLoader } from '~/routes/_features/booking/session/select-time/booking.select-time.loader';
import { BookingSelectTimePage } from '~/routes/_features/booking/session/select-time/booking.select-time.page';

export const loader = createBookingSelectTimeLoader({ surface: 'public' });
export const action = createBookingSelectTimeAction({ surface: 'public' });

export default BookingSelectTimePage;
