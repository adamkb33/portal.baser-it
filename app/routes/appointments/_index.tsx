import { createCookie, data, redirect, useLoaderData, type LoaderFunctionArgs } from 'react-router';
import type { ApiClientError } from '~/api/clients/http';
import { bookingApi } from '~/lib/utils';

export const appointmentSessionCookie = createCookie('appointment_session', {
  httpOnly: true,
  sameSite: 'lax',
  secure: true,
  path: '/',
});

export async function loader({ request, params }: LoaderFunctionArgs) {
  const companyIdParam = params.companyId;
  const companyId = Number(companyIdParam);

  if (!companyIdParam || isNaN(companyId)) {
    return redirect('/');
  }

  try {
    const cookieHeader = request.headers.get('Cookie');
    const existingSessionId: string | null = await appointmentSessionCookie.parse(cookieHeader);

    const appointmentSessionResponse =
      await bookingApi().PublicAppointmentControllerService.PublicAppointmentControllerService.getOrCreateSession({
        companyId,
        sessionId: existingSessionId ?? undefined,
      });

    const sessionId = appointmentSessionResponse.sessionId;

    const setCookieHeader = await appointmentSessionCookie.serialize(sessionId);

    return data(
      { sessionId, companyId },
      {
        headers: {
          'Set-Cookie': setCookieHeader,
        },
      },
    );
  } catch (error: unknown) {
    const apiErr = error as ApiClientError;
    return data(
      {
        error: apiErr?.body?.message ?? 'An unexpected error occurred',
      },
      { status: 400 },
    );
  }
}

export default function Appointments() {
  const loaderData = useLoaderData<{ sessionId?: string; error?: string }>();

  if (loaderData.error) {
    return <div>Error: {loaderData.error}</div>;
  }

  return <div>{loaderData.sessionId}</div>;
}
