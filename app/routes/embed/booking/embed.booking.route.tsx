import { redirect, type LoaderFunctionArgs } from 'react-router';
import { getBookingRouteHref } from '~/routes/_features/booking/_utils/booking.route-map';

export function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const target = new URL(getBookingRouteHref('embed', 'appointment'), url.origin);
  target.search = url.search;
  return redirect(`${target.pathname}${target.search}`);
}

export default function EmbedBookingRoute() {
  return null;
}
