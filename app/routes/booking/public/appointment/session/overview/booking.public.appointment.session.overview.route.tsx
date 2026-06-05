import { createBookingOverviewAction } from '~/routes/_features/booking/session/overview/booking.overview.action';
import { createBookingOverviewLoader } from '~/routes/_features/booking/session/overview/booking.overview.loader';
import { BookingOverviewPage } from '~/routes/_features/booking/session/overview/booking.overview.page';

export const loader = createBookingOverviewLoader({ surface: 'public' });
export const action = createBookingOverviewAction({ surface: 'public' });

export default BookingOverviewPage;
