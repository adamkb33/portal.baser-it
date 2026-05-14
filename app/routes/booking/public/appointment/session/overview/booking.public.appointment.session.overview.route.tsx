import { redirect, Form, useNavigation } from 'react-router';
import type { Route } from './+types/booking.public.appointment.session.overview.route';
import { Calendar, User, Mail, DollarSign, CheckCircle2 } from 'lucide-react';
import { PublicAppointmentSessionController } from '~/api/generated/booking';
import { ROUTES_MAP } from '~/lib/route-tree';
import { redirectWithError } from '~/lib/flash-message.server';
import { resolveErrorPayload } from '~/lib/api-error';
import { requireAuthenticatedBookingFlow } from '../_utils/require-authenticated-booking-flow.server';
import { BookingStepTemplate, Button, Container, KeyValueList, PageHeader, Panel, Stack, Text } from '~/ui';

export async function loader({ request }: Route.LoaderArgs) {
  try {
    const guardResult = await requireAuthenticatedBookingFlow(request);
    if (guardResult instanceof Response) {
      return guardResult;
    }
    const { session } = guardResult;

    const response = await PublicAppointmentSessionController.getAppointmentSessionOverview({
      query: {
        sessionId: session.sessionId,
      },
    });

    if (!response.data?.data) {
      const message = response.data?.message || 'Kunne ikke hente oversikt';
      return redirectWithError(request, ROUTES_MAP['booking.public.appointment.session.select-time'].href, message);
    }

    return {
      sessionOverview: response.data.data,
    };
  } catch (error) {
    const { message } = resolveErrorPayload(error, 'Kunne ikke hente oversikt');
    return redirectWithError(request, ROUTES_MAP['booking.public.appointment'].href, message);
  }
}

export async function action({ request }: Route.ActionArgs) {
  try {
    const guardResult = await requireAuthenticatedBookingFlow(request);
    if (guardResult instanceof Response) {
      return guardResult;
    }
    const { session } = guardResult;

    const submitResponse = await PublicAppointmentSessionController.submitAppointmentSession({
      query: {
        sessionId: session.sessionId,
      },
    });

    const appointmentId = submitResponse.data?.data?.id;
    if (!appointmentId) {
      return redirectWithError(
        request,
        ROUTES_MAP['booking.public.appointment.session.overview'].href,
        'Kunne ikke bekrefte timebestilling',
      );
    }

    return redirect(
      `${ROUTES_MAP['booking.public.appointment.success'].href}?companyId=${session.companyId}&appointmentId=${appointmentId}`,
    );
  } catch (error) {
    const { message } = resolveErrorPayload(error, 'Kunne ikke bekrefte timebestilling');
    return redirectWithError(request, ROUTES_MAP['booking.public.appointment'].href, message);
  }
}

/* ========================================
   DATE FORMATTING
   ======================================== */

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

function formatNorwegianDateTime(dateTimeString: string): {
  dayName: string;
  date: string;
  time: string;
  full: string;
} {
  const dateObj = new Date(dateTimeString);
  const dayName = DAYS_NO[dateObj.getDay()];
  const day = dateObj.getDate();
  const month = MONTHS_NO[dateObj.getMonth()];
  const year = dateObj.getFullYear();
  const time = dateTimeString.split('T')[1]?.substring(0, 5) || '';

  return {
    dayName,
    date: `${day}. ${month} ${year}`,
    time: `kl. ${time}`,
    full: `${dayName} ${day}. ${month} ${year} kl. ${time}`,
  };
}

/* ========================================
   MAIN COMPONENT
   ======================================== */

export default function BookingPublicAppointmentSessionOverviewRoute({ loaderData }: Route.ComponentProps) {
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';

  if (!loaderData.sessionOverview) {
    return (
      <Container size="lg">
        <PageHeader title="Bekreft timebestilling" description="Kunne ikke hente oversikt" />
      </Container>
    );
  }

  const { sessionOverview } = loaderData;
  const totalDuration = sessionOverview.selectedServices.reduce((sum, item) => sum + item.services.duration, 0);
  const totalPrice = sessionOverview.selectedServices.reduce((sum, item) => sum + item.services.price, 0);

  const dateTime = formatNorwegianDateTime(sessionOverview.selectedStartTime);

  return (
    <BookingStepTemplate
      title="Bekreft timebestilling"
      description="Gjennomgå detaljene før du bekrefter."
      footer={
        <div className="flex flex-col gap-2 md:flex-row md:justify-end">
          <Form method="get" action={ROUTES_MAP['booking.public.appointment.session.select-time'].href}>
            <Button type="submit" variant="outline" size="md" fullWidth>
              Endre tidspunkt
            </Button>
          </Form>
          <Form method="post">
            <Button type="submit" size="lg" fullWidth loading={isSubmitting} disabled={isSubmitting}>
              <CheckCircle2 className="size-5" strokeWidth={2.5} />
              Bekreft og book time
            </Button>
          </Form>
        </div>
      }
    >
      <Stack space="lg">
        <Panel title="Oversikt" description="Kontroller informasjonen før bekreftelse.">
          <div className="space-y-4">
            <div className="rounded-md border border-border bg-background p-3">
              <div className="mb-2 flex items-center justify-between gap-3">
                <Text as="p" variant="label">
                  Tidspunkt
                </Text>
                <a
                  href={ROUTES_MAP['booking.public.appointment.session.select-time'].href}
                  className="text-xs text-text-secondary"
                >
                  Endre
                </a>
              </div>
              <KeyValueList
                items={[
                  { label: 'Dato', value: dateTime.full, icon: <Calendar className="size-4" /> },
                  { label: 'Varighet', value: `${totalDuration} min` },
                  { label: 'Pris', value: `${totalPrice} kr`, icon: <DollarSign className="size-4" /> },
                ]}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-md border border-border bg-background p-3">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <Text as="p" variant="label">
                    Kontakt
                  </Text>
                  <a
                    href={ROUTES_MAP['booking.public.appointment.session.contact'].href}
                    className="text-xs text-text-secondary"
                  >
                    Endre
                  </a>
                </div>
                <KeyValueList
                  layout="stacked"
                  items={[
                    {
                      label: 'Navn',
                      value: `${sessionOverview.user.givenName} ${sessionOverview.user.familyName}`,
                      icon: <User className="size-4" />,
                    },
                    ...(sessionOverview.user.email
                      ? [{ label: 'E-post', value: sessionOverview.user.email, icon: <Mail className="size-4" /> }]
                      : []),
                  ]}
                />
              </div>
              <div className="rounded-md border border-border bg-background p-3">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <Text as="p" variant="label">
                    Behandler
                  </Text>
                  <a
                    href={ROUTES_MAP['booking.public.appointment.session.employee'].href}
                    className="text-xs text-text-secondary"
                  >
                    Endre
                  </a>
                </div>
                <div className="flex items-start gap-3">
                  {sessionOverview.selectedProfile.image ? (
                    <div className="h-12 w-12 shrink-0 overflow-hidden rounded-sm border border-border bg-surface">
                      <img
                        src={sessionOverview.selectedProfile.image.url}
                        alt={`${sessionOverview.selectedProfile.givenName} ${sessionOverview.selectedProfile.familyName}`}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ) : null}
                  <Text as="p" variant="body-sm" className="font-semibold">
                    {sessionOverview.selectedProfile.givenName} {sessionOverview.selectedProfile.familyName}
                  </Text>
                </div>
              </div>
            </div>

            <div className="rounded-md border border-border bg-background p-3">
              <div className="mb-2 flex items-center justify-between gap-3">
                <Text as="p" variant="label">
                  Tjenester
                </Text>
                <a
                  href={ROUTES_MAP['booking.public.appointment.session.select-services'].href}
                  className="text-xs text-text-secondary"
                >
                  Endre
                </a>
              </div>
              <div className="grid gap-2 md:grid-cols-2">
                {sessionOverview.selectedServices.map((item, index) => (
                  <div key={index} className="rounded-md border border-border bg-background p-2.5">
                    <div className="flex items-center justify-between gap-3">
                      <Text as="p" variant="body-sm" className="font-medium">
                        {item.services.name}
                      </Text>
                      <Text as="p" variant="body-sm" className="text-text-secondary">
                        {item.services.price} kr
                      </Text>
                    </div>
                    <Text as="p" variant="caption" className="mt-0.5 text-text-secondary">
                      {item.services.duration} min
                    </Text>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Panel>
      </Stack>
    </BookingStepTemplate>
  );
}
