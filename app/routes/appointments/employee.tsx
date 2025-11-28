import { data, redirect, type LoaderFunctionArgs } from 'react-router';
import type { ApiClientError } from '~/api/clients/http';
import type { AppointmentSessionDto } from '~/api/clients/types';
import { getSession } from '~/lib/appointments.server';

export type AppointmentsEmployeeLoaderData = {
  session: AppointmentSessionDto;
  error?: string;
};

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const session = await getSession(request);

    if (!session) {
      return redirect('/appointments');
    }

    return data<AppointmentsEmployeeLoaderData>({ session });
  } catch (error: any) {
    console.error(JSON.stringify(error, null, 2));

    if (error as ApiClientError) {
      return { error: (error as ApiClientError).body.message };
    }

    throw error;
  }
}

export default function AppointmentsEmployee() {
  return <div>AppointmentsEmployee</div>;
}
