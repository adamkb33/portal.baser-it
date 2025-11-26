import { redirect, type LoaderFunctionArgs } from 'react-router';
import type { ApiClientError } from '~/api/clients/http';
import { getSession } from '~/lib/appointments.server';

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const session = await getSession(request);

    if (session) {
      return redirect('/appointments/contact-form');
    }

    return null;
  } catch (error: any) {
    console.error(JSON.stringify(error, null, 2));

    if (error as ApiClientError) {
      return { error: error.body.message };
    }

    throw error;
  }
}

export default function AppointmentsRoute() {
  return <div>_index</div>;
}
