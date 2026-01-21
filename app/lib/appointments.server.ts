
import { createCookie } from 'react-router';
import { PublicAppointmentSessionController, type AppointmentSessionDto } from '~/api/generated/booking';

const BOOKING_BASE_URL =
  process.env.VITE_API_BOOKING_SERVICE_URL || 'http://localhost:8080/booking-service';
const CREATE_SESSION_URL = `${BOOKING_BASE_URL}/public/appointment-session/create-session`;
const GET_SESSION_URL = `${BOOKING_BASE_URL}/public/appointment-session/get-session`;

export const appointmentSessionCookie = createCookie('appointment_session', {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: 60 * 60 * 24,
});

export async function createAppointmentSession(
  companyId: number,
): Promise<{ session: AppointmentSessionDto; setCookieHeader: string }> {
  console.debug('[appointments.create-session] request', {
    url: CREATE_SESSION_URL,
    companyId,
  });
  const sessionResponse =
    await PublicAppointmentSessionController.createAppointmentSession(
      {
        query: {
          companyId,
        },
      },
    );

  if (!sessionResponse.data?.data) {
    throw Error('Kunne ikke hente session');
  }

  const setCookieHeader = await appointmentSessionCookie.serialize(sessionResponse.data.data.sessionId);

  return { session: sessionResponse.data.data, setCookieHeader };
}

export async function getSession(request: Request): Promise<AppointmentSessionDto> {
  const cookieHeader = request.headers.get('Cookie');
  const sessionId = await appointmentSessionCookie.parse(cookieHeader);

  if (!sessionId || typeof sessionId !== 'string') {
    throw new Response('Missing appointment session', { status: 400 });
  }
  console.debug('[appointments.get-session] request', {
    url: GET_SESSION_URL,
    sessionId,
  });
  const sessionResponse =
    await PublicAppointmentSessionController.getAppointmentSession(
      {
        query: {
          sessionId,
        },
      },
    );

  if (!sessionResponse.data) {
    throw Error('Kunne ikke hente session');
  }

  if (!sessionResponse.data.data) {
    throw Error('Kunne ikke hente session');
  }

  return sessionResponse.data.data;
}


