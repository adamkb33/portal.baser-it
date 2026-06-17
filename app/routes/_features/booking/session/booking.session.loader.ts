import { redirect, type LoaderFunctionArgs } from 'react-router';
import { AppointmentsController } from '~/api/generated/booking';
import { redirectWithError } from '~/lib/flash-message.server';
import { AppointmentSessionService } from '../_services/booking.appointment-session.service.server';
import { getBookingRouteMap } from '../_utils/booking.route-map';
import type { BookingSurface } from '../_utils/booking.surface';

type CreateBookingSessionLoaderOptions = {
  surface: BookingSurface;
};

function parseCompanyId(value: string): number | null {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
}

export function createBookingSessionLoader({ surface }: CreateBookingSessionLoaderOptions) {
  return async function bookingSessionLoader(args: LoaderFunctionArgs) {
    const routes = getBookingRouteMap(surface);

    try {
      const sessionResult = await AppointmentSessionService.getResult(args.request);
      const url = new URL(args.request.url);
      const companyIdParam = url.searchParams.get('companyId');

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

        await AppointmentsController.validateCompanyBooking({
          path: {
            companyId: companyIdNumber,
          },
        });

        const created = await AppointmentSessionService.create(companyIdNumber, args.request);
        const headers = new Headers();
        headers.append('Set-Cookie', clearSessionCookie);
        headers.append('Set-Cookie', created.setCookieHeader);

        return redirect(routes.contact, { headers });
      }

      const session = sessionResult.status === 'found' ? sessionResult.session : null;

      if (session) {
        if (companyIdParam) {
          const companyIdNumber = parseCompanyId(companyIdParam);

          if (companyIdNumber === null) {
            return redirectWithError(args.request, routes.appointment, 'Selskaps-ID er ugyldig.');
          }

          if (session.companyId == companyIdNumber) {
            return redirect(routes.contact);
          }

          if (session.companyId !== companyIdNumber) {
            await AppointmentSessionService.delete(args.request);
            const created = await AppointmentSessionService.create(companyIdNumber, args.request);

            return redirect(routes.contact, {
              headers: {
                'Set-Cookie': created.setCookieHeader,
              },
            });
          }
        }

        return redirect(routes.contact);
      }

      if (!companyIdParam) {
        return redirectWithError(args.request, routes.appointment, 'Selskaps-ID mangler.');
      }

      const companyIdNumber = parseCompanyId(companyIdParam);

      if (companyIdNumber === null) {
        return redirectWithError(args.request, routes.appointment, 'Selskaps-ID er ugyldig.');
      }

      await AppointmentsController.validateCompanyBooking({
        path: {
          companyId: companyIdNumber,
        },
      });

      const created = await AppointmentSessionService.create(companyIdNumber, args.request);

      return redirect(routes.contact, {
        headers: {
          'Set-Cookie': created.setCookieHeader,
        },
      });
    } catch (error: unknown) {
      if (error instanceof Response) {
        throw error;
      }

      return redirectWithError(args.request, routes.appointment, 'Noe gikk galt under oppstart av booking. Prøv igjen.');
    }
  };
}
