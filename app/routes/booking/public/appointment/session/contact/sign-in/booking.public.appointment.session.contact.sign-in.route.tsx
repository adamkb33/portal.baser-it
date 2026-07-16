import { redirect } from 'react-router';
import { getBookingRouteMap } from '~/routes/booking/public/_utils/booking.route-map';
import type { Route } from './+types/booking.public.appointment.session.contact.sign-in.route';

export async function loader(_args: Route.LoaderArgs) {
  return redirect(getBookingRouteMap().contact);
}

export async function action(_args: Route.ActionArgs) {
  return redirect(getBookingRouteMap().contact);
}

export default function BookingContactSignInRedirect() {
  return null;
}
