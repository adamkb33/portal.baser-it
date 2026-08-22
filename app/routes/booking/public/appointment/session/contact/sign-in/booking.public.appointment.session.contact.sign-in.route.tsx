import { redirect } from 'react-router';
import { ROUTES_MAP } from '~/lib/routing/route-tree';
import { getBookingRouteMap } from '~/routes/booking/public/_utils/booking.route-map';
import { clearManualContactOverride } from '../_utils/manual-contact-override.cookie.server';
import type { Route } from './+types/booking.public.appointment.session.contact.sign-in.route';

function signInHrefBackToContact() {
  const returnTo = encodeURIComponent(getBookingRouteMap().contact);
  return `${ROUTES_MAP['auth.sign-in'].href}?returnTo=${returnTo}`;
}

async function redirectToSignIn() {
  return redirect(signInHrefBackToContact(), {
    headers: { 'Set-Cookie': await clearManualContactOverride() },
  });
}

export async function loader(_args: Route.LoaderArgs) {
  return redirectToSignIn();
}

export async function action(_args: Route.ActionArgs) {
  return redirectToSignIn();
}

export default function BookingContactSignInRedirect() {
  return null;
}
