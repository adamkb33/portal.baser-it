// app/routes/booking.public.appointment-session.$sessionId.tsx
import { data, Outlet, redirect, useLoaderData } from 'react-router';
import type { LoaderFunctionArgs } from 'react-router';
import { getSession } from '~/lib/appointments.server';
import type { AppointmentSessionDto } from '~/api/generated/booking';
import { type RouteData } from '~/lib/api-error';
import { ROUTES_MAP } from '~/lib/route-tree';

export type BookingPublicAppointmentSessionLayoutLoaderData = RouteData<{
  session?: AppointmentSessionDto | null;
}>;

export async function loader(args: LoaderFunctionArgs) {
  try {
    const session = await getSession(args.request);
    if (!session) {
      return redirect(ROUTES_MAP['booking.public.appointment'].href);
    }
    return data<BookingPublicAppointmentSessionLayoutLoaderData>({ ok: true, session });
  } catch (error: any) {
    return redirect(ROUTES_MAP['booking.public.appointment'].href);
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
      <Outlet />
    </div>
  );
}
