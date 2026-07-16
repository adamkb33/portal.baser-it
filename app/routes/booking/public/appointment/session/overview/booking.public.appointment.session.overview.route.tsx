import { PublicAppointmentSessionController } from '~/api/generated/booking';
import { resolveErrorPayload } from '~/lib/api-error';
import { redirectWithError } from '~/lib/flash-message.server';
import { BookingCompanyBadge } from '~/routes/booking/public/_components/booking-company-badge';
import { getBookingCompanySummary } from '~/routes/booking/public/_utils/booking-company.server';
import { requireBookingReady } from '~/routes/booking/public/_utils/booking.require-authenticated-flow.server';
import { getBookingRouteMap } from '~/routes/booking/public/_utils/booking.route-map';
import { redirect } from 'react-router';
import { useState } from 'react';
import { Form, Link, useNavigation } from 'react-router';
import { Calendar, User, Mail, DollarSign, CheckCircle2 } from 'lucide-react';
import { BookingStepTemplate, Container, KeyValueList, PageHeader, Stack, Text } from '~/ui';
import { BookingBottomActionBar } from '~/routes/booking/public/_components/bottom-nav';
import type { Route } from './+types/booking.public.appointment.session.overview.route';

export async function loader({ request }: Route.LoaderArgs) {
  const routes = getBookingRouteMap();

  try {
    const guardResult = await requireBookingReady(request);
    if (guardResult instanceof Response) {
      return guardResult;
    }

    const { session } = guardResult;
    const [response, companySummary] = await Promise.all([
      PublicAppointmentSessionController.getAppointmentSessionOverview({
        query: {
          sessionId: session.sessionId,
        },
      }),
      getBookingCompanySummary(session.companyId),
    ]);

    if (!response.data?.data) {
      const message = response.data?.message || 'Kunne ikke hente oversikt';
      return redirectWithError(request, routes.selectTime, message);
    }

    return {
      sessionOverview: response.data.data,
      companySummary,
      navigation: {
        contact: routes.contact,
        employee: routes.employee,
        selectServices: routes.selectServices,
        selectTime: routes.selectTime,
      },
    };
  } catch (error) {
    const { message } = resolveErrorPayload(error, 'Kunne ikke hente oversikt');
    return redirectWithError(request, routes.appointment, message);
  }
}

export async function action({ request }: Route.ActionArgs) {
  const routes = getBookingRouteMap();

  try {
    const guardResult = await requireBookingReady(request);
    if (guardResult instanceof Response) {
      return guardResult;
    }

    const { session } = guardResult;
    const submitResponse = await PublicAppointmentSessionController.submitAppointmentSession({
      query: {
        sessionId: session.sessionId,
      },
    });

    const appointmentId = submitResponse.data?.data?.appointmentId;
    if (!appointmentId) {
      return redirectWithError(request, routes.overview, 'Kunne ikke bekrefte timebestilling');
    }

    return redirect(`${routes.success}?companyId=${session.companyId}&appointmentId=${appointmentId}`);
  } catch (error) {
    const { message } = resolveErrorPayload(error, 'Kunne ikke bekrefte timebestilling');
    return redirectWithError(request, routes.appointment, message);
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

export default function BookingOverviewPage({ loaderData }: Route.ComponentProps) {
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';
  const [showAllServices, setShowAllServices] = useState(false);

  if (!loaderData.sessionOverview) {
    return (
      <Container size="lg">
        <PageHeader title="Bekreft timebestilling" description="Kunne ikke hente oversikt" />
      </Container>
    );
  }

  const { sessionOverview } = loaderData;
  const totalDuration =
    sessionOverview.totalDurationMinutes ??
    sessionOverview.selectedServices.reduce((sum, item) => sum + item.services.duration * item.quantity, 0);
  const totalPrice =
    sessionOverview.totalPrice ??
    sessionOverview.selectedServices.reduce((sum, item) => sum + item.services.price * item.quantity, 0);
  const totalServiceCount = sessionOverview.selectedServices.reduce((sum, item) => sum + item.quantity, 0);
  const collapsedServices = sessionOverview.selectedServices.slice(0, 3);
  const additionalServices = sessionOverview.selectedServices.slice(3);

  const dateTime = formatNorwegianDateTime(sessionOverview.selectedStartTime);
  const changeTimeFormId = 'booking-overview-change-time-form';
  const confirmFormId = 'booking-overview-confirm-form';

  return (
    <BookingStepTemplate
      title="Bekreft timebestilling"
      description="Gjennomgå detaljene før du bekrefter."
      headerMeta={<BookingCompanyBadge company={loaderData.companySummary} />}
    >
      <Stack space="lg">
        <Form id={changeTimeFormId} method="get" action={loaderData.navigation.selectTime} className="hidden" />
        <Form id={confirmFormId} method="post" className="hidden" />
        <section className="space-y-4 rounded-[var(--radius-booking-panel)] bg-booking-surface-muted p-3 shadow-[var(--shadow-booking-panel)] md:p-5">
          <header className="space-y-1">
            <Text as="h2" variant="label" className="text-booking-text">
              Oversikt
            </Text>
            <Text as="p" variant="body-sm" className="text-booking-text-muted">
              Kontroller informasjonen før bekreftelse.
            </Text>
          </header>

          <div className="grid gap-2 sm:grid-cols-3">
            <div className="rounded-[var(--radius-booking-card)] bg-booking-surface-strong px-3 py-2">
              <Text as="p" variant="caption" className="uppercase tracking-wide text-booking-text-muted">
                Tjenester
              </Text>
              <Text as="p" variant="body-sm" className="tabular-nums font-semibold text-booking-text">
                {totalServiceCount}
              </Text>
            </div>
            <div className="rounded-[var(--radius-booking-card)] bg-booking-surface-strong px-3 py-2">
              <Text as="p" variant="caption" className="uppercase tracking-wide text-booking-text-muted">
                Varighet
              </Text>
              <Text as="p" variant="body-sm" className="tabular-nums font-semibold text-booking-text">
                {totalDuration} min
              </Text>
            </div>
            <div className="rounded-[var(--radius-booking-card)] bg-booking-surface-strong px-3 py-2">
              <Text as="p" variant="caption" className="uppercase tracking-wide text-booking-text-muted">
                Totalpris
              </Text>
              <Text as="p" variant="body-sm" className="tabular-nums font-semibold text-booking-text">
                {totalPrice} kr
              </Text>
            </div>
          </div>

          <div className="space-y-3">
            <section className="rounded-[var(--radius-booking-card)] bg-booking-surface-subtle p-2.5 md:p-3">
              <div className="mb-2 flex items-center justify-between gap-3 border-b border-booking-border pb-2">
                <Text as="p" variant="label">
                  Tidspunkt
                </Text>
                <Link to={loaderData.navigation.selectTime} className="text-xs text-booking-text-muted">
                  Endre
                </Link>
              </div>
              <div className="rounded-[var(--radius-booking-card)] bg-booking-surface-strong p-2.5 md:p-3">
                <KeyValueList
                  items={[
                    { label: 'Dato', value: dateTime.full, icon: <Calendar className="size-4" /> },
                    { label: 'Varighet', value: `${totalDuration} min` },
                    { label: 'Pris', value: `${totalPrice} kr`, icon: <DollarSign className="size-4" /> },
                  ]}
                />
              </div>
            </section>

            <div className="grid gap-3 md:grid-cols-2">
              <section className="rounded-[var(--radius-booking-card)] bg-booking-surface-subtle p-2.5 md:p-3">
                <div className="mb-2 flex items-center justify-between gap-3 border-b border-booking-border pb-2">
                  <Text as="p" variant="label">
                    Kontakt
                  </Text>
                  <Link to={loaderData.navigation.contact} className="text-xs text-booking-text-muted">
                    Endre
                  </Link>
                </div>
                <div className="rounded-[var(--radius-booking-card)] bg-booking-surface-strong p-2.5 md:p-3">
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
              </section>

              <section className="rounded-[var(--radius-booking-card)] bg-booking-surface-subtle p-2.5 md:p-3">
                <div className="mb-2 flex items-center justify-between gap-3 border-b border-booking-border pb-2">
                  <Text as="p" variant="label">
                    Behandler
                  </Text>
                  <Link to={loaderData.navigation.employee} className="text-xs text-booking-text-muted">
                    Endre
                  </Link>
                </div>
                <div className="rounded-[var(--radius-booking-card)] bg-booking-surface-strong p-2.5 md:p-3">
                  <div className="flex items-start gap-3">
                    {sessionOverview.selectedProfile.image ? (
                      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-[var(--radius-booking-field)] bg-booking-surface-muted">
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
              </section>
            </div>

            <section className="rounded-[var(--radius-booking-card)] bg-booking-surface-subtle p-2.5 md:p-3">
              <div className="mb-2 flex items-center justify-between gap-3 border-b border-booking-border pb-2">
                <Text as="p" variant="label">
                  Tjenester
                </Text>
                <Link to={loaderData.navigation.selectServices} className="text-xs text-booking-text-muted">
                  Endre
                </Link>
              </div>
              <div className="grid gap-2 md:grid-cols-2">
                {collapsedServices.map((item) => (
                  <div
                    key={`${item.serviceGroup.id}-${item.services.id}`}
                    className="rounded-[var(--radius-booking-card)] bg-booking-surface-strong p-2.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <Text as="p" variant="body-sm" className="truncate text-sm font-medium md:text-base">
                          {item.services.name}
                        </Text>
                        {item.quantity > 1 ? (
                          <Text as="p" variant="caption" className="text-booking-text-muted">
                            Antall: {item.quantity}
                          </Text>
                        ) : null}
                      </div>
                      <Text as="p" variant="body-sm" className="shrink-0 text-sm text-booking-text-muted md:text-base">
                        <span className="tabular-nums">{item.services.price * item.quantity}</span> kr
                      </Text>
                    </div>
                    <Text as="p" variant="caption" className="mt-0.5 text-booking-text-muted">
                      <span className="tabular-nums">{item.services.duration * item.quantity}</span> min
                    </Text>
                  </div>
                ))}
              </div>
              {additionalServices.length > 0 ? (
                <div className="mt-2 space-y-2">
                  {showAllServices ? (
                    <div id="overview-more-services" className="grid gap-2 md:grid-cols-2">
                      {additionalServices.map((item) => (
                        <div
                          key={`${item.serviceGroup.id}-${item.services.id}`}
                          className="rounded-[var(--radius-booking-card)] bg-booking-surface-muted p-2.5"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="min-w-0">
                              <Text as="p" variant="body-sm" className="truncate text-sm font-medium md:text-base">
                                {item.services.name}
                              </Text>
                              {item.quantity > 1 ? (
                                <Text as="p" variant="caption" className="text-booking-text-muted">
                                  Antall: {item.quantity}
                                </Text>
                              ) : null}
                            </div>
                            <Text
                              as="p"
                              variant="body-sm"
                              className="shrink-0 text-sm text-booking-text-muted md:text-base"
                            >
                              <span className="tabular-nums">{item.services.price * item.quantity}</span> kr
                            </Text>
                          </div>
                          <Text as="p" variant="caption" className="mt-0.5 text-booking-text-muted">
                            <span className="tabular-nums">{item.services.duration * item.quantity}</span> min
                          </Text>
                        </div>
                      ))}
                    </div>
                  ) : null}
                  <button
                    type="button"
                    className="flex w-full items-center justify-between rounded-[var(--radius-booking-control)] bg-booking-surface-strong px-3 py-2 text-left"
                    onClick={() => setShowAllServices((prev) => !prev)}
                    aria-expanded={showAllServices}
                    aria-controls="overview-more-services"
                  >
                    <Text as="span" variant="body-sm" className="font-medium">
                      {showAllServices ? 'Vis færre' : 'Vis flere'}
                    </Text>
                    {!showAllServices ? (
                      <Text as="span" variant="caption" className="text-booking-text-muted">
                        +{additionalServices.length} flere
                      </Text>
                    ) : null}
                  </button>
                </div>
              ) : null}
            </section>
          </div>
        </section>
      </Stack>
      <BookingBottomActionBar
        actions={[
          {
            id: 'change-time',
            type: 'button',
            buttonType: 'submit',
            form: changeTimeFormId,
            label: 'Endre tid',
            variant: 'secondary',
            disabled: isSubmitting,
          },
          {
            id: 'confirm',
            type: 'button',
            buttonType: 'submit',
            form: confirmFormId,
            label: 'Bekreft',
            icon: <CheckCircle2 className="size-4" strokeWidth={2.5} />,
            variant: 'primary',
            loading: isSubmitting,
            disabled: isSubmitting,
          },
        ]}
        compact
      />
    </BookingStepTemplate>
  );
}
