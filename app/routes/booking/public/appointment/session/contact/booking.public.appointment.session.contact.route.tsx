import { data, redirect } from 'react-router';
import type { Route } from './+types/booking.public.appointment.session.contact.route';
import { getContactLoaderResult, resolveContactFlowHref } from './_utils/contact-flow.server';

export async function loader({ request }: Route.LoaderArgs) {
  const { data: loaderData, status, redirectResponse } = await getContactLoaderResult(request);
  if (redirectResponse) {
    return redirectResponse;
  }
  const targetHref = resolveContactFlowHref(loaderData);
  const currentPath = new URL(request.url).pathname;
  if (currentPath !== targetHref) {
    return redirect(targetHref);
  }
  return data(loaderData, status ? { status } : undefined);
}

export default function BookingPublicAppointmentSessionContactRoute() {
  return null;
}
