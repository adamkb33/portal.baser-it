import { redirect } from 'react-router';
import { Loader2 } from 'lucide-react';
import { appointmentSessionCookie, createAppointmentSession, getSession } from '~/lib/appointments.server';
import { AppointmentsController, type AppointmentSessionDto } from '~/api/generated/booking';
import { ROUTES_MAP } from '~/lib/route-tree';
import { redirectWithError } from '~/routes/company/_lib/flash-message.server';
import { resolveErrorPayload } from '~/lib/api-error';
import type { Route } from './+types/booking.public.appointment.session.route';
import { decodeFromRequest, ensureEncodedCompanyIdRedirect } from '~/lib/company-id-url.server';

export async function loader(args: Route.LoaderArgs) {
  try {
    const url = new URL(args.request.url);
    const companyIdParam = url.searchParams.get('companyId');
    if (!companyIdParam) {
      return redirectWithError(args.request, ROUTES_MAP['booking.public.appointment'].href, 'Selskaps-ID mangler.');
    }

    const companyIdNumber = decodeFromRequest(args.request);
    if (companyIdNumber === null) {
      return redirectWithError(args.request, ROUTES_MAP['booking.public.appointment'].href, 'Selskaps-ID er ugyldig.');
    }

    const redirectResponse = ensureEncodedCompanyIdRedirect(args.request, companyIdNumber);
    if (redirectResponse) {
      return redirectResponse;
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
    let clearCookieHeader: string | undefined;

    session = await getSession(args.request);

    if (session && session.companyId !== companyIdNumber) {
      clearCookieHeader = await appointmentSessionCookie.serialize('', { maxAge: 0 });
      session = null;
    }

    if (!session) {
      try {
        const created = await createAppointmentSession(companyIdNumber);
        session = created.session;
        setCookieHeader = created.setCookieHeader;
      } catch (error) {
        const { message } = resolveErrorPayload(error, 'Kunne ikke opprette bookingøkt.');
        return redirectWithError(args.request, ROUTES_MAP['booking.public.appointment'].href, message);
      }
    }

    const search = url.search;
    const target = `${ROUTES_MAP['booking.public.appointment.session.contact'].href}${search}`;
    if (setCookieHeader || clearCookieHeader) {
      const headers = new Headers();
      if (clearCookieHeader) {
        headers.append('Set-Cookie', clearCookieHeader);
      }
      if (setCookieHeader) {
        headers.append('Set-Cookie', setCookieHeader);
      }
      return redirect(target, { headers });
    }

    return redirect(target);
  } catch (error: any) {
    if (error instanceof Response) {
      throw error;
    }
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
