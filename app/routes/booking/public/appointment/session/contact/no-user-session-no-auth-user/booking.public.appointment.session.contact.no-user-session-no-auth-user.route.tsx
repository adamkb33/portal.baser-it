import { data, redirect } from 'react-router';
import type { Route } from './+types/booking.public.appointment.session.contact.no-user-session-no-auth-user.route';
import { NoUserSessionNoAuthUserFlow } from '../_flows/no-user-session-no-auth-user.flow';
import { getSession } from '~/lib/appointments.server';
import { handleSignUp } from '~/routes/auth/_features/sign-up.handler';
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

  if (intent === ACTION_INTENT.SIGN_UP_LOCAL) {
    const result = await handleSignUp(formData);

    if (!result.ok) {
      return data(
        {
          error: result.error,
          values: result.values,
        },
        { status: result.status },
      );
    }

    const session = await getSession(request);
    if (!session) {
      return redirect(ROUTES_MAP['booking.public.appointment'].href);
    }
    const userId = result.signUp.userId;

    if (session?.sessionId && userId) {
      await PublicAppointmentSessionController.setPendingAppointmentSessionUser({
        path: { sessionId: session.sessionId },
        query: { userId },
      });
    }

    return data({
      signUp: result.signUp,
      error: null as string | null,
    });
  }

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

export default function BookingPublicAppointmentSessionContactNoUserSessionNoAuthUserRoute() {
  return <NoUserSessionNoAuthUserFlow />;
}
