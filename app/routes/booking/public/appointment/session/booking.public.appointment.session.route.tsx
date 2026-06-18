import type { Route } from './+types/booking.public.appointment.session.route';
import { Loader2 } from 'lucide-react';
import { redirect } from 'react-router';
import { AppointmentsController } from '~/api/generated/booking';
import {
  parseBookingContext,
  resolveBookingTheme,
  serializeBookingContext,
  type BookingContext,
} from '~/lib/booking-context.server';
import { redirectWithError } from '~/lib/flash-message.server';
import { AppointmentSessionService } from '~/routes/booking/public/_services/booking.appointment-session.service.server';
import { getBookingRouteMap } from '~/routes/booking/public/_utils/booking.route-map';
import { parseCompanyId } from '~/utils';

function appendSetCookie(headers: Headers, value: string | null | undefined) {
  if (value) {
    headers.append('Set-Cookie', value);
  }
}

async function createBookingContextCookie(context: BookingContext, companyId: number) {
  return serializeBookingContext({
    companyId,
    theme: context.theme,
  });
}

async function validateCompanyBooking(companyId: number) {
  await AppointmentsController.validateCompanyBooking({
    path: {
      companyId,
    },
  });
}

export async function loader(args: Route.LoaderArgs) {
  const routes = getBookingRouteMap();

  try {
    const url = new URL(args.request.url);
    const bookingContext = await parseBookingContext(args.request);
    const requestedTheme = url.searchParams.get('theme');
    const theme = requestedTheme === null ? bookingContext.theme : resolveBookingTheme(requestedTheme);

    if (!theme) {
      return redirectWithError(args.request, routes.appointment, 'Tema er ugyldig.');
    }

    const nextContext: BookingContext = {
      companyId: bookingContext.companyId,
      theme,
    };
    const companyIdParam =
      url.searchParams.get('companyId') ?? (nextContext.companyId ? String(nextContext.companyId) : null);
    const shouldResetSession = url.searchParams.get('reset') === '1';
    const sessionResult = shouldResetSession
      ? ({ status: 'missing-cookie' } as const)
      : await AppointmentSessionService.getResult(args.request);
    const resetSessionCookie = shouldResetSession ? await AppointmentSessionService.delete(args.request) : null;

    if (sessionResult.status === 'stale-cookie') {
      const clearSessionCookie = await AppointmentSessionService.delete(args.request);

      if (!companyIdParam) {
        return redirectWithError(args.request, routes.appointment, 'Bookingøkten er utløpt. Start på nytt.', {
          'Set-Cookie': clearSessionCookie,
        });
      }

      const companyIdNumber = parseCompanyId(companyIdParam);

      if (companyIdNumber === null) {
        return redirectWithError(args.request, routes.appointment, 'Selskaps-ID er ugyldig.', {
          'Set-Cookie': clearSessionCookie,
        });
      }

      await validateCompanyBooking(companyIdNumber);

      const created = await AppointmentSessionService.create(companyIdNumber, args.request);
      const headers = new Headers();
      headers.append('Set-Cookie', clearSessionCookie);
      headers.append('Set-Cookie', created.setCookieHeader);
      headers.append('Set-Cookie', await createBookingContextCookie(nextContext, companyIdNumber));

      return redirect(routes.contact, { headers });
    }

    const session = sessionResult.status === 'found' ? sessionResult.session : null;

    if (session) {
      if (companyIdParam) {
        const companyIdNumber = parseCompanyId(companyIdParam);

        if (companyIdNumber === null) {
          return redirectWithError(args.request, routes.appointment, 'Selskaps-ID er ugyldig.');
        }

        if (session.companyId === companyIdNumber) {
          return redirect(routes.contact, {
            headers: {
              'Set-Cookie': await createBookingContextCookie(nextContext, session.companyId),
            },
          });
        }

        if (session.companyId !== companyIdNumber) {
          const clearSessionCookie = await AppointmentSessionService.delete(args.request);
          const created = await AppointmentSessionService.create(companyIdNumber, args.request);
          const headers = new Headers();
          appendSetCookie(headers, clearSessionCookie);
          appendSetCookie(headers, created.setCookieHeader);
          appendSetCookie(headers, await createBookingContextCookie(nextContext, companyIdNumber));

          return redirect(routes.contact, { headers });
        }
      }

      return redirect(routes.contact, {
        headers: {
          'Set-Cookie': await createBookingContextCookie(nextContext, session.companyId),
        },
      });
    }

    if (!companyIdParam) {
      return redirectWithError(args.request, routes.appointment, 'Selskaps-ID mangler.');
    }

    const companyIdNumber = parseCompanyId(companyIdParam);

    if (companyIdNumber === null) {
      return redirectWithError(args.request, routes.appointment, 'Selskaps-ID er ugyldig.');
    }

    await validateCompanyBooking(companyIdNumber);

    const created = await AppointmentSessionService.create(companyIdNumber, args.request);
    const headers = new Headers();
    appendSetCookie(headers, resetSessionCookie);
    appendSetCookie(headers, created.setCookieHeader);
    appendSetCookie(headers, await createBookingContextCookie(nextContext, companyIdNumber));

    return redirect(routes.contact, { headers });
  } catch (error: unknown) {
    if (error instanceof Response) {
      throw error;
    }

    return redirectWithError(args.request, routes.appointment, 'Noe gikk galt under oppstart av booking. Prøv igjen.');
  }
}

export function BookingSessionPage() {
  return (
    <div className="flex min-h-40 items-center justify-center">
      <div className="flex items-center gap-2 rounded-[var(--radius-booking-panel)] border-[length:var(--border-booking-card)] border-booking-border bg-booking-surface-raised px-4 py-3 shadow-[var(--shadow-booking-card)]">
        <Loader2 className="size-5 animate-spin text-booking-text-muted" />
        <span className="text-sm text-booking-text-muted">Laster booking...</span>
      </div>
    </div>
  );
}
