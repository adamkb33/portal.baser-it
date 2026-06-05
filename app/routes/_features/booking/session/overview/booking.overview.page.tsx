import { useState } from 'react';
import { Form, Link, useLoaderData, useNavigation } from 'react-router';
import { Calendar, User, Mail, DollarSign, CheckCircle2 } from 'lucide-react';
import { BookingStepTemplate, Container, KeyValueList, PageHeader, Stack, Text } from '~/ui';
import { BookingBottomActionBar } from '~/routes/_features/booking/_components/bottom-nav';
import type { createBookingOverviewLoader } from './booking.overview.loader';

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

export function BookingOverviewPage() {
  const loaderData = useLoaderData<ReturnType<typeof createBookingOverviewLoader>>();
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
    >
      <Stack space="lg">
        <Form id={changeTimeFormId} method="get" action={loaderData.navigation.selectTime} className="hidden" />
        <Form id={confirmFormId} method="post" className="hidden" />
        <section className="space-y-4 rounded-lg bg-surface p-3 md:p-5">
          <header className="space-y-1">
            <Text as="h2" variant="label" className="text-text-primary">
              Oversikt
            </Text>
            <Text as="p" variant="body-sm" className="text-text-secondary">
              Kontroller informasjonen før bekreftelse.
            </Text>
          </header>

          <div className="grid gap-2 sm:grid-cols-3">
            <div className="rounded-md bg-surface-variant-2 px-3 py-2">
              <Text as="p" variant="caption" className="uppercase tracking-wide text-text-secondary">
                Tjenester
              </Text>
              <Text as="p" variant="body-sm" className="tabular-nums font-semibold text-text-primary">
                {totalServiceCount}
              </Text>
            </div>
            <div className="rounded-md bg-surface-variant-2 px-3 py-2">
              <Text as="p" variant="caption" className="uppercase tracking-wide text-text-secondary">
                Varighet
              </Text>
              <Text as="p" variant="body-sm" className="tabular-nums font-semibold text-text-primary">
                {totalDuration} min
              </Text>
            </div>
            <div className="rounded-md bg-surface-variant-2 px-3 py-2">
              <Text as="p" variant="caption" className="uppercase tracking-wide text-text-secondary">
                Totalpris
              </Text>
              <Text as="p" variant="body-sm" className="tabular-nums font-semibold text-text-primary">
                {totalPrice} kr
              </Text>
            </div>
          </div>

          <div className="space-y-3">
            <section className="rounded-md bg-surface-variant-1 p-2.5 md:p-3">
              <div className="mb-2 flex items-center justify-between gap-3 border-b border-border pb-2">
                <Text as="p" variant="label">Tidspunkt</Text>
                <Link to={loaderData.navigation.selectTime} className="text-xs text-text-secondary">Endre</Link>
              </div>
              <div className="rounded-md bg-surface-variant-2 p-2.5 md:p-3">
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
              <section className="rounded-md bg-surface-variant-1 p-2.5 md:p-3">
                <div className="mb-2 flex items-center justify-between gap-3 border-b border-border pb-2">
                  <Text as="p" variant="label">Kontakt</Text>
                  <Link to={loaderData.navigation.contact} className="text-xs text-text-secondary">Endre</Link>
                </div>
                <div className="rounded-md bg-surface-variant-2 p-2.5 md:p-3">
                  <KeyValueList
                    layout="stacked"
                    items={[
                      { label: 'Navn', value: `${sessionOverview.user.givenName} ${sessionOverview.user.familyName}`, icon: <User className="size-4" /> },
                      ...(sessionOverview.user.email ? [{ label: 'E-post', value: sessionOverview.user.email, icon: <Mail className="size-4" /> }] : []),
                    ]}
                  />
                </div>
              </section>

              <section className="rounded-md bg-surface-variant-1 p-2.5 md:p-3">
                <div className="mb-2 flex items-center justify-between gap-3 border-b border-border pb-2">
                  <Text as="p" variant="label">Behandler</Text>
                  <Link to={loaderData.navigation.employee} className="text-xs text-text-secondary">Endre</Link>
                </div>
                <div className="rounded-md bg-surface-variant-2 p-2.5 md:p-3">
                  <div className="flex items-start gap-3">
                    {sessionOverview.selectedProfile.image ? (
                      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-sm bg-surface">
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

            <section className="rounded-md bg-surface-variant-1 p-2.5 md:p-3">
              <div className="mb-2 flex items-center justify-between gap-3 border-b border-border pb-2">
                <Text as="p" variant="label">Tjenester</Text>
                <Link to={loaderData.navigation.selectServices} className="text-xs text-text-secondary">Endre</Link>
              </div>
              <div className="grid gap-2 md:grid-cols-2">
                {collapsedServices.map((item) => (
                  <div key={`${item.serviceGroup.id}-${item.services.id}`} className="rounded-md bg-surface-variant-2 p-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <Text as="p" variant="body-sm" className="truncate text-sm font-medium md:text-base">
                          {item.services.name}
                        </Text>
                        {item.quantity > 1 ? (
                          <Text as="p" variant="caption" className="text-text-secondary">
                            Antall: {item.quantity}
                          </Text>
                        ) : null}
                      </div>
                      <Text as="p" variant="body-sm" className="shrink-0 text-sm text-text-secondary md:text-base">
                        <span className="tabular-nums">{item.services.price * item.quantity}</span> kr
                      </Text>
                    </div>
                    <Text as="p" variant="caption" className="mt-0.5 text-text-secondary">
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
                        <div key={`${item.serviceGroup.id}-${item.services.id}`} className="rounded-md bg-surface p-2.5">
                          <div className="flex items-center justify-between gap-2">
                            <div className="min-w-0">
                              <Text as="p" variant="body-sm" className="truncate text-sm font-medium md:text-base">
                                {item.services.name}
                              </Text>
                              {item.quantity > 1 ? (
                                <Text as="p" variant="caption" className="text-text-secondary">
                                  Antall: {item.quantity}
                                </Text>
                              ) : null}
                            </div>
                            <Text as="p" variant="body-sm" className="shrink-0 text-sm text-text-secondary md:text-base">
                              <span className="tabular-nums">{item.services.price * item.quantity}</span> kr
                            </Text>
                          </div>
                          <Text as="p" variant="caption" className="mt-0.5 text-text-secondary">
                            <span className="tabular-nums">{item.services.duration * item.quantity}</span> min
                          </Text>
                        </div>
                      ))}
                    </div>
                  ) : null}
                  <button
                    type="button"
                    className="flex w-full items-center justify-between rounded-md bg-surface-variant-2 px-3 py-2 text-left"
                    onClick={() => setShowAllServices((prev) => !prev)}
                    aria-expanded={showAllServices}
                    aria-controls="overview-more-services"
                  >
                    <Text as="span" variant="body-sm" className="font-medium">
                      {showAllServices ? 'Vis færre' : 'Vis flere'}
                    </Text>
                    {!showAllServices ? (
                      <Text as="span" variant="caption" className="text-text-secondary">
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
