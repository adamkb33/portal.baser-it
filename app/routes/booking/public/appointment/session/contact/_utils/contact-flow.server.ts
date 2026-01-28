import { redirect } from 'react-router';
import { getSession } from '~/lib/appointments.server';
import { authService, AuthenticationError } from '~/lib/auth-service';
import { withAuth } from '~/api/utils/with-auth';
import { resolveErrorPayload } from '~/lib/api-error';
import { PublicAppointmentSessionController } from '~/api/generated/booking';
import { decodeFromRequest, ensureEncodedCompanyIdRedirect } from '~/lib/company-id-url.server';
import { ROUTES_MAP } from '~/lib/route-tree';
import type { ContactLoaderData } from './contact-types';

type ContactLoaderResult = {
  data: ContactLoaderData;
  status?: number;
  redirectResponse?: Response;
};

export const resolveContactFlowHref = ({ session, authSession, sessionUser, error }: ContactLoaderData): string => {
  if (error) {
    return ROUTES_MAP['booking.public.appointment.session.contact.debug'].href;
  }
  if (session && !session.userId && !authSession) {
    return ROUTES_MAP['booking.public.appointment.session.contact.no-user-session-no-auth-user'].href;
  }
  if (session && session.userId && !authSession) {
    return ROUTES_MAP['booking.public.appointment.session.contact.session-user-no-auth'].href;
  }
  if (session && session.userId && sessionUser?.userDto && sessionUser.nextStep === 'VERIFY_EMAIL') {
    return ROUTES_MAP['booking.public.appointment.session.contact.verify-email'].href;
  }
  if (session && session.userId && sessionUser?.userDto && sessionUser.nextStep === 'VERIFY_MOBILE') {
    return ROUTES_MAP['booking.public.appointment.session.contact.verify-mobile'].href;
  }
  return ROUTES_MAP['booking.public.appointment.session.contact.debug'].href;
};

export async function getContactLoaderResult(request: Request): Promise<ContactLoaderResult> {
  try {
    const companyIdFromUrl = decodeFromRequest(request);

    let authSession: Awaited<ReturnType<typeof authService.getUserSession>> | null = null;
    let accessToken: string | null = null;

    const session = await getSession(request);
    if (!session) {
      return {
        data: { session: null, authSession: null, sessionUser: null, error: null },
        redirectResponse: redirect(ROUTES_MAP['booking.public.appointment'].href),
      };
    }

    try {
      const userSession = await authService.getUserSession(request);
      authSession = userSession;
      accessToken = userSession.accessToken;
    } catch (error) {
      if (!(error instanceof AuthenticationError)) {
        throw error;
      }
    }

    let sessionUser = null;

    if (session?.userId) {
      try {
        sessionUser = accessToken
          ? await withAuth(
              request,
              async () => {
                const response = await PublicAppointmentSessionController.getPendingAppointmentSessionUser({
                  path: { sessionId: session.sessionId },
                });
                return response.data?.data ?? null;
              },
              accessToken,
            )
          : ((
              await PublicAppointmentSessionController.getPendingAppointmentSessionUser({
                path: { sessionId: session.sessionId },
              })
            ).data?.data ?? null);
      } catch {
        sessionUser = null;
      }
    }

    const ensuredCompanyId = session?.companyId ?? companyIdFromUrl;

    const redirectResponse = ensureEncodedCompanyIdRedirect(request, ensuredCompanyId);
    if (redirectResponse) {
      return { data: { session, authSession, sessionUser, error: null }, redirectResponse };
    }

    return {
      data: {
        session,
        authSession,
        sessionUser,
        error: null,
      },
    };
  } catch (error) {
    const { message, status } = resolveErrorPayload(error, 'Kunne ikke hente kontaktinformasjon');
    return {
      data: {
        session: null,
        authSession: null,
        sessionUser: null,
        error: message,
      },
      status: status ?? 400,
    };
  }
}
