import { redirect } from 'react-router';
import { ROUTES_MAP } from '~/lib/route-tree';
import type { Route } from './+types/booking.public.appointment.session.route';

export async function loader(args: Route.LoaderArgs) {
  return redirect(ROUTES_MAP['booking.public.appointment.session.contact'].href);
}

export default function BookingPublicAppointmentSessionRoute({loaderData}: Route.ComponentProps) {
  return (
    <div>
      <h1>BookingPublicAppointmentSessionRoute</h1>
      <pre>{JSON.stringify(loaderData, null, 2)}</pre>
    </div>
  );
}
