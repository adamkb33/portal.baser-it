import { data, redirect, Link } from 'react-router';
import type { Route } from './+types/booking.public.appointment.success.route';
import { CalendarPlus, Check, MapPin } from 'lucide-react';
import { PublicCompanyController } from '~/api/generated/base';
import { AppointmentsController, PublicAppointmentSessionController } from '~/api/generated/booking';
import { withAuth } from '~/api/utils/with-auth';
import { resolveErrorPayload } from '~/lib/api-error';
import { ROUTES_MAP } from '~/lib/routing/route-tree';
import { AppointmentSessionService } from '~/routes/booking/public/_services/booking.appointment-session.service.server';
import { withBookingBackendCall, withBookingFlowLog } from '~/routes/booking/public/_utils/booking-flow-log.server';
import { Button as BookingButton, Container as BookingContainer, PageHeader as BookingStepHeader } from '~/ui';
import { formatNorwegianDateTime } from '../session/overview/_utils/format-norwegian-date-time';

const ROUTE_ID = 'booking.public.appointment.success';

export async function loader({ request }: Route.LoaderArgs) {
  return withBookingFlowLog({ request, routeId: ROUTE_ID, kind: 'loader', step: 'success' }, async () => {
    return successLoader({ request } as Route.LoaderArgs);
  });
}

async function successLoader({ request }: Route.LoaderArgs) {
  try {
    const url = new URL(request.url);
    const companyId = url.searchParams.get('companyId');
    const appointmentId = url.searchParams.get('appointmentId');
    const parsedAppointmentId = appointmentId ? Number(appointmentId) : NaN;
    if (!appointmentId || Number.isNaN(parsedAppointmentId)) {
      return redirect(ROUTES_MAP['booking.public.appointment'].href);
    }
    if (!companyId) {
      throw Error('Selskap ikke gjenkjent');
    }

    await withBookingBackendCall(
      {
        request,
        routeId: ROUTE_ID,
        step: 'success',
        call: 'validate-company-booking',
        context: { companyId: parseInt(companyId) },
      },
      () =>
        withAuth(request, () =>
          AppointmentsController.validateCompanyBooking({
            path: {
              companyId: parseInt(companyId),
            },
          }),
        ),
    );

    const companyResponse = await withBookingBackendCall(
      {
        request,
        routeId: ROUTE_ID,
        step: 'success',
        call: 'get-company',
        context: { companyId: parseInt(companyId) },
      },
      () =>
        withAuth(request, () =>
          PublicCompanyController.publicGetCompanyById({
            path: {
              companyId: parseInt(companyId),
            },
          }),
        ),
    );

    if (!companyResponse.data?.data) {
      throw Error('Selskap ikke funnet');
    }

    try {
      const appointmentResponse = await withBookingBackendCall(
        {
          request,
          routeId: ROUTE_ID,
          step: 'success',
          call: 'get-appointment',
          context: { appointmentId: parsedAppointmentId },
        },
        () =>
          withAuth(request, () =>
            PublicAppointmentSessionController.getAppointmentById({
              query: {
                appointmentId: parsedAppointmentId,
              },
            }),
          ),
      );
      const appointment = appointmentResponse.data?.data;
      if (!appointment) {
        return data({
          companySummary: companyResponse.data.data,
          appointment: null,
          providerName: null as string | null,
          error: 'Kunne ikke hente avtaledetaljene',
        });
      }

      let providerName: string | null = null;
      try {
        const session = await AppointmentSessionService.get(request);
        if (session) {
          const profilesResponse = await withBookingBackendCall(
            {
              request,
              routeId: ROUTE_ID,
              step: 'success',
              call: 'get-provider',
              context: { appointmentId: parsedAppointmentId, profileId: appointment.profileId },
            },
            () =>
              withAuth(request, () =>
                PublicAppointmentSessionController.getAppointmentSessionProfiles({
                  query: { sessionId: session.sessionId },
                }),
              ),
          );
          const profile = profilesResponse.data?.data?.find((item) => item.id === appointment.profileId);
          providerName = profile ? [profile.givenName, profile.familyName].filter(Boolean).join(' ') : null;
        }
      } catch {
        providerName = null;
      }

      return data({
        companySummary: companyResponse.data.data,
        appointment,
        providerName,
        error: null as string | null,
      });
    } catch {
      return data({
        companySummary: companyResponse.data.data,
        appointment: null,
        providerName: null as string | null,
        error: 'Kunne ikke hente avtaledetaljene',
      });
    }
  } catch (error) {
    const { message, status } = resolveErrorPayload(error, 'Kunne ikke hente bekreftelse');
    return data(
      {
        companySummary: null,
        appointment: null,
        providerName: null as string | null,
        error: message,
      },
      { status: status ?? 400 },
    );
  }
}

export default function BookingPublicAppointmentSessionSuccessRoute({ loaderData }: Route.ComponentProps) {
  if (!loaderData.companySummary) {
    return (
      <BookingContainer>
        <BookingStepHeader title="Timen er bestilt" description={loaderData.error ?? 'Kunne ikke hente bekreftelse'} />
      </BookingContainer>
    );
  }

  const { companySummary } = loaderData;
  const companyName = formatCompanyDisplayName(companySummary.name);
  const formattedAddress = formatAddress(companySummary.businessAddress);
  const mapsUrl = buildGoogleMapsUrl(companySummary.businessAddress);
  const appointment = loaderData.appointment;
  const services = appointment?.groupedServiceGroups.flatMap((group) => group.services) ?? [];
  const dateTime = appointment ? formatNorwegianDateTime(appointment.startTime) : null;
  const calendarPayload = appointment
    ? buildCalendarPayload({
        appointment,
        companyName,
        formattedAddress,
      })
    : null;

  return (
    <BookingContainer size="lg" className="py-6 md:py-10">
      <div className="mx-auto w-full max-w-2xl space-y-6">
        <section
          className="flex flex-col items-center gap-3 rounded-[var(--radius-booking-panel)] border border-booking-confirm/25 bg-success-soft px-4 py-6 text-center text-booking-confirm md:py-8"
          aria-labelledby="booking-success-heading"
        >
          <span className="flex size-12 items-center justify-center rounded-full bg-booking-confirm text-booking-confirm-contrast">
            <Check className="size-7" strokeWidth={3} aria-hidden="true" />
          </span>
          <h1 id="booking-success-heading" className="text-2xl font-bold md:text-3xl">
            Timen er bestilt
          </h1>
        </section>

        {appointment && dateTime ? (
          <section aria-label="Avtaledetaljer">
            <div className="border-b border-booking-border pb-5">
              <h2 className="text-3xl font-bold tracking-tight text-booking-text md:text-4xl">{dateTime.short}</h2>
              <div className="mt-2 space-y-1">
                {services.map((service) => (
                  <p key={service.id} className="text-base text-booking-text md:text-lg">
                    <span className="font-medium">{service.name}</span>
                    <span className="text-booking-text-muted">
                      {' '}
                      · {service.duration} min · {service.price} kr
                    </span>
                  </p>
                ))}
              </div>
            </div>

            <dl className="grid grid-cols-[minmax(84px,auto)_minmax(0,1fr)] items-baseline gap-x-4">
              <SummaryRow label="Behandler">
                <p className="font-medium text-booking-text">{loaderData.providerName ?? 'Ikke oppgitt'}</p>
              </SummaryRow>
              <SummaryRow label="Sted">
                <div className="text-booking-text">
                  <p className="font-medium">{companyName}</p>
                  {formattedAddress ? <p className="text-booking-text-muted">{formattedAddress}</p> : null}
                </div>
              </SummaryRow>
            </dl>
          </section>
        ) : (
          <p className="text-booking-text-muted">{loaderData.error ?? 'Kunne ikke vise avtaledetaljene.'}</p>
        )}

        <p className="text-sm text-booking-text-muted">Vi har sendt bekreftelse på SMS.</p>

        <div className="space-y-3 pt-1">
          {calendarPayload ? (
            <BookingButton asChild variant="outline" size="lg" fullWidth>
              <a href={calendarPayload.href} download={calendarPayload.filename}>
                <CalendarPlus aria-hidden="true" />
                Legg til i kalender
              </a>
            </BookingButton>
          ) : (
            <BookingButton type="button" variant="outline" size="lg" fullWidth disabled>
              <CalendarPlus aria-hidden="true" />
              Legg til i kalender
            </BookingButton>
          )}

          {mapsUrl ? (
            <BookingButton asChild variant="outline" size="lg" fullWidth>
              <a href={mapsUrl} target="_blank" rel="noopener noreferrer">
                <MapPin aria-hidden="true" />
                Vis veibeskrivelse
              </a>
            </BookingButton>
          ) : (
            <BookingButton type="button" variant="outline" size="lg" fullWidth disabled>
              <MapPin aria-hidden="true" />
              Vis veibeskrivelse
            </BookingButton>
          )}

          <Link
            to={ROUTES_MAP['booking.public.my-appointments'].href}
            className="mx-auto flex min-h-11 w-fit items-center justify-center px-3 text-sm font-semibold text-booking-action underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-[length:var(--border-booking-focus-ring)] focus-visible:ring-booking-action"
          >
            Se mine bookinger
          </Link>
        </div>
      </div>
    </BookingContainer>
  );
}

function SummaryRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <>
      <dt className="border-b border-booking-border py-4 text-sm text-booking-text-muted">{label}</dt>
      <dd className="min-w-0 border-b border-booking-border py-4 text-sm">{children}</dd>
    </>
  );
}

function formatAddress(address: { addressLines?: Array<string>; postalCode?: string; city?: string } | undefined) {
  if (!address) return null;
  const cityLine = [address.postalCode, address.city].filter(Boolean).join(' ');
  const parts = [...(address.addressLines ?? []), cityLine].filter(Boolean);
  return parts.length ? parts.join(', ') : null;
}

function buildGoogleMapsUrl(
  address: { addressLines?: Array<string>; postalCode?: string; city?: string; country?: string } | undefined,
) {
  if (!address) return null;
  const query = [...(address.addressLines ?? []), address.postalCode, address.city, address.country]
    .filter(Boolean)
    .join(' ');
  return query ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}` : null;
}

function buildCalendarPayload({
  appointment,
  companyName,
  formattedAddress,
}: {
  appointment: NonNullable<Route.ComponentProps['loaderData']['appointment']>;
  companyName: string;
  formattedAddress: string | null;
}) {
  const formatIcsDate = (date: Date) => `${date.toISOString().replace(/[-:]/g, '').split('.')[0]}Z`;
  const serviceNames = appointment.groupedServiceGroups.flatMap((group) =>
    group.services.map((service) => service.name).filter(Boolean),
  );
  const description = serviceNames.length ? `Tjenester: ${serviceNames.join(', ')}` : '';
  const summary = `Avtale hos ${companyName}`;
  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Pitell//Booking//NO',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${appointment.id}-${appointment.startTime}`,
    `DTSTAMP:${formatIcsDate(new Date())}`,
    `DTSTART:${formatIcsDate(new Date(appointment.startTime))}`,
    `DTEND:${formatIcsDate(new Date(appointment.endTime))}`,
    `SUMMARY:${summary}`,
    description ? `DESCRIPTION:${description}` : null,
    formattedAddress ? `LOCATION:${formattedAddress}` : null,
    'END:VEVENT',
    'END:VCALENDAR',
  ]
    .filter(Boolean)
    .join('\r\n');

  return {
    href: `data:text/calendar;charset=utf-8,${encodeURIComponent(`${icsContent}\r\n`)}`,
    filename: `${companyName || 'appointment'}.ics`.replace(/\s+/g, '-').toLocaleLowerCase('nb-NO'),
  };
}

function formatCompanyDisplayName(name?: string | null): string {
  const trimmedName = name?.trim();
  if (!trimmedName) return 'Virksomheten';

  const lettersOnly = trimmedName.replace(/[^\p{L}]/gu, '');
  if (!lettersOnly || lettersOnly !== lettersOnly.toLocaleUpperCase('nb-NO')) return trimmedName;

  return trimmedName
    .toLocaleLowerCase('nb-NO')
    .replace(/(^|[\s-])(\p{L})/gu, (_match, separator: string, letter: string) => {
      return `${separator}${letter.toLocaleUpperCase('nb-NO')}`;
    });
}
