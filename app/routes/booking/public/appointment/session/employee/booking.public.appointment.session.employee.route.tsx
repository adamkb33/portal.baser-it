import { createBookingEmployeeAction } from '~/routes/_features/booking/session/employee/booking.employee.action';
import { createBookingEmployeeLoader } from '~/routes/_features/booking/session/employee/booking.employee.loader';
import { BookingEmployeePage } from '~/routes/_features/booking/session/employee/booking.employee.page';

export const loader = createBookingEmployeeLoader({ surface: 'public' });
export const action = createBookingEmployeeAction({ surface: 'public' });

export default BookingEmployeePage;
