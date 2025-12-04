// app/lib/session.server.ts

import { createCookie } from 'react-router';
import type { AppointmentSessionDto } from '~/api/clients/booking';
import { bookingApi } from '~/lib/utils';

export const appointmentSessionCookie = createCookie('appointment_session', {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: 60 * 60 * 24,
});

export async function getOrCreateSession(
  request: Request,
  companyId: number,
): Promise<{ session: AppointmentSessionDto; setCookieHeader: string }> {
  const cookieHeader = request.headers.get('Cookie');
  const existingSessionId = (await appointmentSessionCookie.parse(cookieHeader)) ?? undefined;

  const sessionResponse =
    await bookingApi().PublicAppointmentControllerService.PublicAppointmentControllerService.getOrCreateAppointmentSession(
      {
        companyId,
        sessionId: existingSessionId,
      },
    );

  if (!sessionResponse.data) {
    throw Error('Kunne ikke hente session');
  }

  const setCookieHeader = await appointmentSessionCookie.serialize(sessionResponse.data.sessionId);

  return { session: sessionResponse.data, setCookieHeader };
}

export async function getSession(request: Request): Promise<AppointmentSessionDto> {
  const cookieHeader = request.headers.get('Cookie');
  const sessionId = await appointmentSessionCookie.parse(cookieHeader);

  if (!sessionId || typeof sessionId !== 'string') {
    throw new Response('Missing appointment session', { status: 400 });
  }
  const sessionResponse =
    await bookingApi().PublicAppointmentControllerService.PublicAppointmentControllerService.getAppointmentSession({
      sessionId,
    });

  if (!sessionResponse.data) {
    throw Error('Kunne ikke hente session');
  }

  return sessionResponse.data;
}

export async function getSessionId(request: Request): Promise<string> {
  const cookieHeader = request.headers.get('Cookie');
  const sessionId = await appointmentSessionCookie.parse(cookieHeader);

  if (!sessionId || typeof sessionId !== 'string') {
    throw new Response('Missing appointment session', { status: 400 });
  }

  return sessionId;
}
