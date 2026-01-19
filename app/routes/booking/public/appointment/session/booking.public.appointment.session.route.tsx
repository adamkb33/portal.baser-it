import { redirect } from 'react-router';
import { Loader2 } from 'lucide-react';
import { createAppointmentSession, getSession } from '~/lib/appointments.server';
import { AppointmentsController, type AppointmentSessionDto } from '~/api/generated/booking';
import { ROUTES_MAP } from '~/lib/route-tree';
import { redirectWithError } from '~/routes/company/_lib/flash-message.server';
import type { Route } from './+types/booking.public.appointment.session.route';

export async function loader(args: Route.LoaderArgs) {
  try {
    const url = new URL(args.request.url);
    const companyId = url.searchParams.get('companyId');
    if (!companyId) {
      return redirectWithError(
        args.request,
        ROUTES_MAP['booking.public.appointment'].href,
        'Selskaps-ID mangler.',
      );
    }

    const companyIdNumber = Number(companyId);
    if (Number.isNaN(companyIdNumber)) {
      return redirectWithError(
        args.request,
        ROUTES_MAP['booking.public.appointment'].href,
        'Selskaps-ID er ugyldig.',
      );
    }

    try {
      await AppointmentsController.validateCompanyBooking({
        path: {
          companyId: companyIdNumber,
        },
      });
    } catch (error) {
      return redirectWithError(
        args.request,
        ROUTES_MAP['booking.public.appointment'].href,
        'Selskapet har ikke tilgjengelig booking.',
      );
    }

    let session: AppointmentSessionDto | null = null;
    let setCookieHeader: string | undefined;

    try {
      session = await getSession(args.request);
    } catch {
      session = null;
    }

    if (!session || session.companyId !== companyIdNumber) {
      const created = await createAppointmentSession(companyIdNumber);
      session = created.session;
      setCookieHeader = created.setCookieHeader;
    }

    const search = url.search;
    const target = `${ROUTES_MAP['booking.public.appointment.session.contact'].href}${search}`;
    if (setCookieHeader) {
      const headers = new Headers();
      headers.append('Set-Cookie', setCookieHeader);
      return redirect(target, { headers });
    }

    return redirect(target);
  } catch (error: any) {
    return redirect(ROUTES_MAP['booking.public.appointment'].href);
  }
}

export default function BookingPublicAppointmentSessionRoute() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-3">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Laster booking...</span>
      </div>
    </div>
  );
}
