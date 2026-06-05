import { createBookingSelectServicesAction } from '~/routes/_features/booking/session/select-services/booking.select-services.action';
import { createBookingSelectServicesLoader } from '~/routes/_features/booking/session/select-services/booking.select-services.loader';
import { BookingSelectServicesPage } from '~/routes/_features/booking/session/select-services/booking.select-services.page';

export const loader = createBookingSelectServicesLoader({ surface: 'embed' });
export const action = createBookingSelectServicesAction({ surface: 'embed' });

export default BookingSelectServicesPage;
