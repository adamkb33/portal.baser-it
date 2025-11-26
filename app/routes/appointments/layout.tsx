import { data, Outlet, useLoaderData } from 'react-router';
import type { LoaderFunctionArgs } from 'react-router';
import type { AppointmentSessionDto } from 'tmp/openapi/gen/booking';
import type { ApiClientError } from '~/api/clients/http';
import { getOrCreateSession } from '~/lib/appointments.server';

export type AppointmentsLayoutLoaderData = {
  session?: AppointmentSessionDto | null;
  error?: string;
};

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const url = new URL(request.url);
    const companyId = url.searchParams.get('companyId');

    if (companyId) {
      const session = await getOrCreateSession(request, parseInt(companyId));

      return data<AppointmentsLayoutLoaderData>(
        { session: session.session },
        {
          headers: {
            'Set-Cookie': session.setCookieHeader,
          },
        },
      );
    } else {
      return data<AppointmentsLayoutLoaderData>({});
    }
  } catch (error: any) {
    console.error(JSON.stringify(error, null, 2));

    if (error as ApiClientError) {
      return { error: error.body.message };
    }

    throw error;
  }
}

export default function AppointmentsLayout() {
  const loaderData = useLoaderData<AppointmentsLayoutLoaderData>();

  return (
    <div>
      <Outlet context={loaderData} />
    </div>
  );
}
