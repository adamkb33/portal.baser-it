import { createBookingOverviewAction } from '~/routes/_features/booking/session/overview/booking.overview.action';
import { createBookingOverviewLoader } from '~/routes/_features/booking/session/overview/booking.overview.loader';
import { BookingOverviewPage } from '~/routes/_features/booking/session/overview/booking.overview.page';

export const loader = createBookingOverviewLoader({ surface: 'embed' });
export const action = createBookingOverviewAction({ surface: 'embed' });

export default BookingOverviewPage;
