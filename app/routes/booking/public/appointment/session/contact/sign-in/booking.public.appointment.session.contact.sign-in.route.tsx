import { redirect } from 'react-router';
import { ROUTES_MAP } from '~/lib/routing/route-tree';
import type { Route } from './+types/booking.public.appointment.session.contact.sign-in.route';

export async function loader(_args: Route.LoaderArgs) {
  return redirect(ROUTES_MAP['auth.sign-in'].href);
}

export async function action(_args: Route.ActionArgs) {
  return redirect(ROUTES_MAP['auth.sign-in'].href);
}

export default function BookingContactSignInRedirect() {
  return null;
}
