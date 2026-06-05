import { createBookingSelectServicesAction } from '~/routes/_features/booking/session/select-services/booking.select-services.action';
import { createBookingSelectServicesLoader } from '~/routes/_features/booking/session/select-services/booking.select-services.loader';
import { BookingSelectServicesPage } from '~/routes/_features/booking/session/select-services/booking.select-services.page';

export const loader = createBookingSelectServicesLoader({ surface: 'public' });
export const action = createBookingSelectServicesAction({ surface: 'public' });

export default BookingSelectServicesPage;
