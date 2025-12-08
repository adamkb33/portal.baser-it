import { data, redirect, type LoaderFunctionArgs, Form, useLoaderData } from 'react-router';
import type { ApiClientError } from '~/api/clients/http';
import { getSession } from '~/lib/appointments.server';
import { bookingApi } from '~/lib/utils';
import { type ActionFunctionArgs } from 'react-router';
import type { AppointmentSessionOverviewDto } from 'tmp/openapi/gen/booking';
import { ROUTES_MAP } from '~/lib/route-tree';
import {
  BookingContainer,
  BookingPageHeader,
  BookingSection,
  BookingMeta,
  BookingButton,
} from '../../_components/booking-layout';

type BookingPublicAppointmentSessionOverviewRouteLoaderData = {
  sessionOverview: AppointmentSessionOverviewDto;
};

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const session = await getSession(request);

    if (!session) {
      return redirect(ROUTES_MAP['booking.public.appointment'].href);
    }

    const response =
      await bookingApi().PublicAppointmentSessionControllerService.PublicAppointmentSessionControllerService.getAppointmentSessionOverview(
        {
          sessionId: session.sessionId,
        },
      );

    if (!response.data) {
      return redirect(ROUTES_MAP['booking.public.appointment'].href);
    }

    return data<BookingPublicAppointmentSessionOverviewRouteLoaderData>({
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

    await bookingApi().PublicAppointmentSessionControllerService.PublicAppointmentSessionControllerService.submitAppointmentSession(
      {
        sessionId: session.sessionId,
      },
    );

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

export default function BookingPublicAppointmentSessionOverviewRoute() {
  const { sessionOverview } = useLoaderData<BookingPublicAppointmentSessionOverviewRouteLoaderData>();

  const totalDuration = sessionOverview.selectedServices.reduce((sum, item) => sum + item.services.duration, 0);
  const totalPrice = sessionOverview.selectedServices.reduce((sum, item) => sum + item.services.price, 0);

  return (
    <BookingContainer>
      <BookingSection label="Kontaktinformasjon">
        <BookingMeta
          items={[
            { label: 'Navn', value: `${sessionOverview.contact.givenName} ${sessionOverview.contact.familyName}` },
            ...(sessionOverview.contact.email?.value
              ? [{ label: 'E-post', value: sessionOverview.contact.email.value }]
              : []),
            ...(sessionOverview.contact.mobileNumber?.value
              ? [{ label: 'Mobil', value: sessionOverview.contact.mobileNumber.value }]
              : []),
          ]}
        />
      </BookingSection>

      {/* Selected profile */}
      <BookingSection label="Valgt frisør">
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
      </BookingSection>

      {/* Selected services */}
      <BookingSection label="Valgte tjenester">
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
      </BookingSection>

      {/* Selected time */}
      <BookingSection label="Tidspunkt">
        <span className="text-sm text-foreground">{formatNorwegianDateTime(sessionOverview.selectedStartTime)}</span>
      </BookingSection>

      {/* Action buttons */}
      <BookingSection>
        <Form method="post">
          <BookingButton type="submit" variant="primary" fullWidth>
            Bekreft og book time
          </BookingButton>
        </Form>

        <div className="flex gap-2">
          <Form method="get" action="/appointments/contact" className="flex-1">
            <BookingButton type="submit" variant="outline" fullWidth>
              Endre kontakt
            </BookingButton>
          </Form>
          <Form method="get" action="/appointments/select-services" className="flex-1">
            <BookingButton type="submit" variant="outline" fullWidth>
              Endre tjenester
            </BookingButton>
          </Form>
          <Form method="get" action="/appointments/select-time" className="flex-1">
            <BookingButton type="submit" variant="outline" fullWidth>
              Endre tidspunkt
            </BookingButton>
          </Form>
        </div>
      </BookingSection>
    </BookingContainer>
  );
}
