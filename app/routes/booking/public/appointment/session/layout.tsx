// app/routes/booking.public.appointment-session.$sessionId.tsx
import { data, Outlet, useLoaderData } from 'react-router';
import type { LoaderFunctionArgs } from 'react-router';
import type { ApiClientError } from '~/api/clients/http';
import { getSession } from '~/lib/appointments.server';
import { AppointmentStepper } from './_components/appointment-stepper';
import type { AppointmentSessionDto } from '~/api/clients/types';

export type BookingPublicAppointmentSessionLayoutLoaderData = {
  session?: AppointmentSessionDto;
  error?: string;
};

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const session = await getSession(request);
    return data<BookingPublicAppointmentSessionLayoutLoaderData>({ session });
  } catch (error: any) {
    console.error(JSON.stringify(error, null, 2));
    if (error as ApiClientError) {
      return data<BookingPublicAppointmentSessionLayoutLoaderData>({ error: error.body.message });
    }

    throw error;
  }
}

export default function BookingPublicAppointmentSessionLayout() {
  const data = useLoaderData<typeof loader>();

  if ('error' in data) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="border border-border bg-background p-5 text-center">
          <p className="text-sm text-foreground">{data.error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {data.session && <AppointmentStepper session={data.session} />}

      <main className="shadow-[8px_8px_0px_0px_rgb(120,40,180)]">
        <Outlet />
      </main>
    </div>
  );
}
