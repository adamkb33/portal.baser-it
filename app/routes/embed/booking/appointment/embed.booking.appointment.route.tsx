import { redirect, type LoaderFunctionArgs } from 'react-router';
import { getBookingRouteHref } from '~/routes/_features/booking/_utils/booking.route-map';

export function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const companyId = url.searchParams.get('companyId');

  if (companyId) {
    const target = new URL(getBookingRouteHref('embed', 'entry'), url.origin);
    target.searchParams.set('companyId', companyId);
    return redirect(`${target.pathname}${target.search}`);
  }

  return redirect(getBookingRouteHref('embed', 'entry'));
}

export default function EmbedBookingAppointmentRoute() {
  return null;
}
