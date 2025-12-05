import { data, Outlet, redirect, useLoaderData } from 'react-router';
import type { LoaderFunctionArgs } from 'react-router';
import type { AppointmentSessionDto } from 'tmp/openapi/gen/booking';
import type { ApiClientError } from '~/api/clients/http';
import { getOrCreateSession } from '~/lib/appointments.server';
import { ROUTES_MAP } from '~/lib/route-tree';
import { bookingApi } from '~/lib/utils';

export type AppointmentsLayoutLoaderData = {
  session?: AppointmentSessionDto | null;
  error?: string;
};

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const url = new URL(request.url);
    const companyId = url.searchParams.get('companyId');

    if (companyId) {
      await bookingApi().PublicAppointmentControllerService.PublicAppointmentControllerService.validateCompany({
        companyId: parseInt(companyId),
      });

      const session = await getOrCreateSession(request, parseInt(companyId));

      return redirect(ROUTES_MAP['booking.public.appointment.contact'].href, {
        headers: {
          'Set-Cookie': session.setCookieHeader,
        },
      });
    } else {
      return data<AppointmentsLayoutLoaderData>({});
    }
  } catch (error: any) {
    console.error(JSON.stringify(error, null, 2));

    if (error as ApiClientError) {
      return redirect('/', { status: 302 });
    }

    throw error;
  }
}

export default function AppointmentsLayout() {
  const loaderData = useLoaderData<AppointmentsLayoutLoaderData>();

  return (
    <div>
      {loaderData.session?.sessionId}
      <Outlet context={loaderData} />
    </div>
  );
}
