import { data, redirect, useLoaderData } from 'react-router';
import type { Route } from './+types/booking.public.appointment.session.contact.verify-email.route';
import { VerifyEmailFlow } from '../_flows/verify-email.flow';
import { getSession } from '~/lib/appointments.server';
import { PublicAppointmentSessionController } from '~/api/generated/booking';
import { resolveErrorPayload } from '~/lib/api-error';
import { ROUTES_MAP } from '~/lib/route-tree';
import { ACTION_INTENT } from '../_utils/action-intents';
import { getContactLoaderResult, resolveContactFlowHref } from '../_utils/contact-flow.server';

export const handle = {
  contactFlow: true,
} as const;

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

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const intent = String(formData.get('intent') || '');

  if (intent === ACTION_INTENT.CLEAR_SESSION) {
    try {
      const session = await getSession(request);
      if (!session) {
        return redirect(ROUTES_MAP['booking.public.appointment'].href);
      }
      if (session?.sessionId) {
        await PublicAppointmentSessionController.clearAppointmentSessionUser({
          path: { sessionId: session.sessionId },
        });
      }
      return data({ cleared: true });
    } catch (error) {
      const { message, status } = resolveErrorPayload(error, 'Kunne ikke slette brukerdata.');
      return data({ error: message }, { status: status ?? 400 });
    }
  }

  return data({ error: 'Ukjent handling' }, { status: 400 });
}

export default function BookingPublicAppointmentSessionContactVerifyEmailRoute() {
  const loaderData = useLoaderData<typeof loader>();
  const email = loaderData.sessionUser?.userDto?.email ?? '';

  return <VerifyEmailFlow email={email} />;
}
