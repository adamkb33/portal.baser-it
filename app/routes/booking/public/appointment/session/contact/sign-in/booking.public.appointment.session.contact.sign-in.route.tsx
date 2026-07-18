import { redirect } from 'react-router';
import { ROUTES_MAP } from '~/lib/routing/route-tree';
import { getBookingRouteMap } from '~/routes/booking/public/_utils/booking.route-map';
import type { Route } from './+types/booking.public.appointment.session.contact.sign-in.route';

function signInHrefBackToContact() {
  const returnTo = encodeURIComponent(getBookingRouteMap().contact);
  return `${ROUTES_MAP['auth.sign-in'].href}?returnTo=${returnTo}`;
}

export async function loader(_args: Route.LoaderArgs) {
  return redirect(signInHrefBackToContact());
}

export async function action(_args: Route.ActionArgs) {
  return redirect(signInHrefBackToContact());
}

export default function BookingContactSignInRedirect() {
  return null;
}
