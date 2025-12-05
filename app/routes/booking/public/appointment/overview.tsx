import { data, redirect, type LoaderFunctionArgs, Form, useLoaderData } from 'react-router';
import type { ApiClientError } from '~/api/clients/http';
import { getSession } from '~/lib/appointments.server';
import { bookingApi } from '~/lib/utils';
import { type ActionFunctionArgs } from 'react-router';
import type { AppointmentSessionOverviewDto } from 'tmp/openapi/gen/booking';
import { ROUTES_MAP } from '~/lib/route-tree';

type AppointmentsOverviewLoaderData = {
  sessionOverview: AppointmentSessionOverviewDto;
};

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const session = await getSession(request);

    if (!session) {
      return redirect(ROUTES_MAP['booking.public.appointment'].href);
    }

    const response =
      await bookingApi().PublicAppointmentControllerService.PublicAppointmentControllerService.getAppointmentSessionOverview(
        {
          sessionId: session.sessionId,
        },
      );

    if (!response.data) {
      return redirect(ROUTES_MAP['booking.public.appointment'].href);
    }

    return data<AppointmentsOverviewLoaderData>({
      sessionOverview: response.data,
    });
  } catch (error: any) {
    console.error(JSON.stringify(error, null, 2));
    return redirect('/');
  }
}

export async function action({ request }: ActionFunctionArgs) {
  try {
    const session = await getSession(request);

    if (!session) {
      return redirect(ROUTES_MAP['booking.public.appointment'].href);
    }

    await bookingApi().PublicAppointmentControllerService.PublicAppointmentControllerService.appointmentSessionSubmit({
      sessionId: session.sessionId,
    });

    return redirect(`${ROUTES_MAP['booking.public.appointment.success'].href}?companyId=${session.companyId}`);
  } catch (error: any) {
    console.error(JSON.stringify(error, null, 2));
    if (error as ApiClientError) {
      return { error: error.body.message };
    }

    throw error;
  }
}

const DAYS_NO = ['Søndag', 'Mandag', 'Tirsdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lørdag'];
const MONTHS_NO = [
  'januar',
  'februar',
  'mars',
  'april',
  'mai',
  'juni',
  'juli',
  'august',
  'september',
  'oktober',
  'november',
  'desember',
];

function formatNorwegianDateTime(dateTimeString: string): string {
  const date = new Date(dateTimeString);
  const dayName = DAYS_NO[date.getDay()];
  const day = date.getDate();
  const month = MONTHS_NO[date.getMonth()];
  const year = date.getFullYear();
  const hours = dateTimeString.split('T')[1]?.substring(0, 5) || '';

  return `${dayName} ${day}. ${month} ${year} kl. ${hours}`;
}

export default function AppointmentsOverview() {
  const { sessionOverview } = useLoaderData<AppointmentsOverviewLoaderData>();

  const totalDuration = sessionOverview.selectedServices.reduce((sum, item) => sum + item.services.duration, 0);
  const totalPrice = sessionOverview.selectedServices.reduce((sum, item) => sum + item.services.price, 0);

  return (
    <div className="space-y-5">
      <div className="border-b border-border pb-4">
        <h1 className="text-base font-semibold text-foreground">Oversikt over avtalen</h1>
        <p className="text-[0.7rem] text-muted-foreground mt-1">
          Sjekk at alle opplysningene stemmer før du bekrefter avtalen
        </p>
      </div>

      <div className="space-y-4">
        {/* Contact information */}
        <div className="border border-border bg-background p-4 sm:p-5 space-y-3">
          <div className="border-b border-border pb-3">
            <span className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
              Kontaktinformasjon
            </span>
          </div>
          <div className="space-y-2">
            <div className="flex items-baseline gap-2">
              <span className="text-[0.7rem] text-muted-foreground min-w-20">Navn:</span>
              <span className="text-sm text-foreground">
                {sessionOverview.contact.givenName} {sessionOverview.contact.familyName}
              </span>
            </div>
            {sessionOverview.contact.email?.value && (
              <div className="flex items-baseline gap-2">
                <span className="text-[0.7rem] text-muted-foreground min-w-20">E-post:</span>
                <span className="text-sm text-foreground">{sessionOverview.contact.email.value}</span>
              </div>
            )}
            {sessionOverview.contact.mobileNumber?.value && (
              <div className="flex items-baseline gap-2">
                <span className="text-[0.7rem] text-muted-foreground min-w-20">Mobil:</span>
                <span className="text-sm text-foreground">{sessionOverview.contact.mobileNumber.value}</span>
              </div>
            )}
          </div>
        </div>

        {/* Selected profile */}
        <div className="border border-border bg-background p-4 sm:p-5 space-y-3">
          <div className="border-b border-border pb-3">
            <span className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">Valgt frisør</span>
          </div>
          <div className="flex gap-3">
            {sessionOverview.selectedProfile.image && (
              <div className="border border-border bg-muted w-16 h-16 flex-shrink-0">
                <img
                  src={sessionOverview.selectedProfile.image.url}
                  alt={`${sessionOverview.selectedProfile.givenName} ${sessionOverview.selectedProfile.familyName}`}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="flex-1">
              <h2 className="text-sm font-semibold text-foreground">
                {sessionOverview.selectedProfile.givenName} {sessionOverview.selectedProfile.familyName}
              </h2>
              {sessionOverview.selectedProfile.description && (
                <p className="text-xs text-muted-foreground mt-1">{sessionOverview.selectedProfile.description}</p>
              )}
            </div>
          </div>
        </div>

        {/* Selected services */}
        <div className="border border-border bg-background p-4 sm:p-5 space-y-3">
          <div className="border-b border-border pb-3">
            <span className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
              Valgte tjenester
            </span>
          </div>
          <div className="space-y-3">
            {sessionOverview.selectedServices.map((item, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm text-foreground">{item.services.name}</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-xs text-muted-foreground">{item.services.duration} min</span>
                    <span className="text-sm font-medium text-foreground">{item.services.price} kr</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-border pt-3">
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-semibold text-foreground">Totalt</span>
              <div className="flex items-baseline gap-2">
                <span className="text-xs text-muted-foreground">{totalDuration} min</span>
                <span className="text-base font-semibold text-foreground">{totalPrice} kr</span>
              </div>
            </div>
          </div>
        </div>

        {/* Selected time */}
        <div className="border border-border bg-background p-4 sm:p-5 space-y-3">
          <div className="border-b border-border pb-3">
            <span className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">Tidspunkt</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-sm text-foreground">
              {formatNorwegianDateTime(sessionOverview.selectedStartTime)}
            </span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="border border-border bg-background p-4 sm:p-5 space-y-3">
          <Form method="post">
            <button
              type="submit"
              className="w-full border border-border bg-foreground text-background px-3 py-2 text-xs font-medium rounded-none"
            >
              Bekreft og book time
            </button>
          </Form>

          <div className="flex gap-2">
            <Form method="get" action="/appointments/contact" className="flex-1">
              <button
                type="submit"
                className="w-full border border-border bg-background text-foreground px-3 py-2 text-xs font-medium rounded-none"
              >
                Endre kontakt
              </button>
            </Form>
            <Form method="get" action="/appointments/select-services" className="flex-1">
              <button
                type="submit"
                className="w-full border border-border bg-background text-foreground px-3 py-2 text-xs font-medium rounded-none"
              >
                Endre tjenester
              </button>
            </Form>
            <Form method="get" action="/appointments/select-time" className="flex-1">
              <button
                type="submit"
                className="w-full border border-border bg-background text-foreground px-3 py-2 text-xs font-medium rounded-none"
              >
                Endre tidspunkt
              </button>
            </Form>
          </div>
        </div>
      </div>
    </div>
  );
}
