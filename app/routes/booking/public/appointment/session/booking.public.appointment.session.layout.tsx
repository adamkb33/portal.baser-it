// app/routes/booking.public.appointment-session.$sessionId.tsx
import { data, Outlet, redirect, useLoaderData } from 'react-router';
import type { LoaderFunctionArgs } from 'react-router';
import { getSession } from '~/lib/appointments.server';
import { RouteAwareStepper } from './_components/route-aware-stepper';
import type { AppointmentSessionDto } from '~/api/generated/booking';
import { type RouteData } from '~/lib/api-error';

export type BookingPublicAppointmentSessionLayoutLoaderData = RouteData<{
  session?: AppointmentSessionDto | null;
}>;

export async function loader(args: LoaderFunctionArgs) {
  try {
    const session = await getSession(args.request);
    if (!session) {
      return redirect('/');
    }
    return data<BookingPublicAppointmentSessionLayoutLoaderData>({ ok: true, session });
  } catch (error: any) {
    return redirect('/');
  }
}

export default function BookingPublicAppointmentSessionLayout() {
  const data = useLoaderData<typeof loader>();

  if (!data.ok) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="border border-border bg-background p-5 text-center">
          <p className="text-sm text-foreground">{data.error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {data.session && <RouteAwareStepper session={data.session} />}

      <Outlet />
    </div>
  );
}
