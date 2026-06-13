import { redirect } from 'react-router';

import { ROUTES_MAP } from '~/lib/routing/route-tree';

export function loader() {
  return redirect(ROUTES_MAP['booking.public.appointment'].href);
}

export default function BookingIndex() {
  return null;
}
