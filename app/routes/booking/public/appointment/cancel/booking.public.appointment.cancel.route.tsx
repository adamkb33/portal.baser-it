import { data, Form, useActionData, useNavigation, useLoaderData } from 'react-router';
import { useState } from 'react';
import type { Route } from './+types/booking.public.appointment.cancel.route';
import { PublicAppointmentSessionController } from '~/api/generated/booking';
import { resolveErrorPayload } from '~/lib/api-error';
import { redirectWithInfo } from '~/lib/flash-message.server';
import { Calendar, Clock, User, Mail, Phone, Sparkles, XCircle } from 'lucide-react';
import { decodeCancelAppointmentToken } from '~/routes/booking/public/_utils/cancel-appointment-token';
import {
  Button,
  Card,
  ConfirmDialog,
  Container,
  KeyValueList,
  Notice,
  PageHeader,
  Panel,
  Stack,
  StickyFooterPageTemplate,
  StickySummaryBar,
  Text,
} from '~/ui';

type CancelActionData = { success: true; message: string } | { success: false; error: string };

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const cancelToken = url.searchParams.get('token');

  if (!cancelToken) {
    return data(
      {
        error: 'Mangler avbestillingstoken i lenken.',
        appointment: null,
        appointmentId: null,
        expiresAt: null,
        token: null,
        cancelToken: null,
      },
      { status: 400 },
    );
  }

  const claims = decodeCancelAppointmentToken(cancelToken);
  if (!claims) {
    return data(
      {
        error: 'Ugyldig avbestillingstoken.',
        appointment: null,
        appointmentId: null,
        expiresAt: null,
        token: null,
        cancelToken,
      },
      { status: 400 },
    );
  }

  const { appointmentId, expiresAt, token } = claims;
  if (!token) {
    return data(
      {
        error: 'Ugyldig avbestillingstoken.',
        appointment: null,
        appointmentId: null,
        expiresAt: null,
        token: null,
        cancelToken,
      },
      { status: 400 },
    );
  }

  if (expiresAt * 1000 < Date.now()) {
    return data(
      {
        error: 'Avbestillingslenken har utløpt. Ta kontakt med oss hvis du trenger hjelp.',
        appointment: null,
        appointmentId,
        expiresAt,
        token: token ?? null,
        cancelToken,
      },
      { status: 400 },
    );
  }

  try {
    const response = await PublicAppointmentSessionController.getAppointmentById({
      query: { appointmentId },
    });
    const appointment = response.data?.data ?? null;

    if (!appointment) {
      return data(
        {
          error: 'Kunne ikke finne avtalen.',
          appointment: null,
          appointmentId,
          expiresAt,
          token: token ?? null,
          cancelToken,
        },
        { status: 404 },
      );
    }

    return data({
      error: null,
      appointment,
      appointmentId,
      expiresAt,
      token: token ?? null,
      cancelToken,
    });
  } catch (err) {
    const { message, status } = resolveErrorPayload(err, 'Kunne ikke hente avtalen.');
    return data(
      {
        error: message,
        appointment: null,
        appointmentId,
        expiresAt,
        token: token ?? null,
        cancelToken,
      },
      { status: status ?? 400 },
    );
  }
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const cancelToken = String(formData.get('token') ?? '');

  if (!cancelToken) {
    return data<CancelActionData>(
      {
        success: false,
        error: 'Mangler avbestillingstoken.',
      },
      { status: 400 },
    );
  }

  const claims = decodeCancelAppointmentToken(cancelToken);
  if (!claims) {
    return data<CancelActionData>(
      {
        success: false,
        error: 'Ugyldig avbestillingstoken.',
      },
      { status: 400 },
    );
  }

  const { token } = claims;
  if (!token) {
    return data<CancelActionData>(
      {
        success: false,
        error: 'Ugyldig avbestillingstoken.',
      },
      { status: 400 },
    );
  }

  try {
    await PublicAppointmentSessionController.cancelAppointment({
      query: {
        token,
      },
    });

    return redirectWithInfo(request, '/', 'Avbestillingen er registrert.');
  } catch (err) {
    const { message } = resolveErrorPayload(err, 'Kunne ikke avbestille timen.');
    return data<CancelActionData>(
      {
        success: false,
        error: message,
      },
      { status: 400 },
    );
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

const formatTimeOnly = (value?: string | null) => {
  if (!value) return null;
  return value.split('T')[1]?.substring(0, 5) ?? null;
};

const formatTimeRange = (start?: string | null, end?: string | null) => {
  if (!start) return null;
  const startTime = formatTimeOnly(start);
  const endTime = formatTimeOnly(end);
  if (!startTime) return null;
  return endTime ? `kl. ${startTime} – ${endTime}` : `kl. ${startTime}`;
};

const getDurationMinutes = (start?: string | null, end?: string | null) => {
  if (!start || !end) return null;
  const startDate = new Date(start);
  const endDate = new Date(end);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) return null;
  const diffMs = endDate.getTime() - startDate.getTime();
  if (diffMs <= 0) return null;
  return Math.round(diffMs / 60000);
};

const formatEpochSeconds = (value?: number | null) => {
  if (!value) return null;
  const date = new Date(value * 1000);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat('nb-NO', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
};

export default function BookingPublicAppointmentCancelRoute() {
  const loaderData = useLoaderData<typeof loader>();
  const error = loaderData?.error ?? null;
  const appointment = loaderData?.appointment ?? null;
  const appointmentId = loaderData?.appointmentId ?? null;
  const expiresAt = loaderData?.expiresAt ?? null;
  const cancelToken = loaderData?.cancelToken ?? null;
  const actionData = useActionData<CancelActionData>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';
  const isExpired = expiresAt ? expiresAt * 1000 < Date.now() : false;
  const canCancel = Boolean(appointmentId && appointment && !error && !isExpired);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const expiresAtLabel = formatEpochSeconds(expiresAt);
  const dateTime = appointment?.startTime ? formatNorwegianDateTime(appointment.startTime) : null;
  const timeRange = formatTimeRange(appointment?.startTime, appointment?.endTime);
  const services = appointment?.groupedServiceGroups.flatMap((group) => group.services) ?? [];
  const contact = appointment?.user ?? null;
  const totalDuration = services.reduce((sum, service) => sum + service.duration, 0);
  const totalPrice = services.reduce((sum, service) => sum + service.price, 0);
  const durationMinutes = totalDuration || getDurationMinutes(appointment?.startTime, appointment?.endTime);
  const actionError = actionData?.success === false ? actionData.error : null;

  if (error && !appointment) {
    return (
      <Container size="lg">
        <PageHeader label="Avbestilling" title="Avbestill time" description={error} />
        <Notice variant="booking" tone="emphasis" title="Kunne ikke hente avtalen" message={error} />
      </Container>
    );
  }

  return (
    <StickyFooterPageTemplate
      footer={
        appointment ? (
          <StickySummaryBar
            title="Avbestill"
            items={[
              { label: 'Dato', value: dateTime?.full ?? appointment?.startTime },
              {
                label: 'Kontaktinformasjon',
                value: `${contact?.givenName ?? ''} ${contact?.familyName ?? ''}`.trim() || '—',
              },
            ]}
            primaryAction={
              <Button
                type="button"
                variant="destructive"
                size="lg"
                fullWidth
                disabled={!canCancel || isSubmitting}
                onClick={() => setIsDeleteOpen(true)}
              >
                Avbestill
              </Button>
            }
          />
        ) : null
      }
    >
      <Container size="lg">
        <Stack space="xl">
          <PageHeader
            label="Avbestilling"
            title="Avbestill time"
            description={expiresAtLabel ? `Lenken er gyldig til ${expiresAtLabel}.` : 'Kontroller opplysningene under.'}
          />
          {appointment && !error ? (
            <Card variant="emphasis" className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-full bg-surface">
                  <XCircle className="size-5 text-text-primary" strokeWidth={2.5} />
                </div>
                <div>
                  <Text as="p" variant="label">
                    Avbestillingsforespørsel
                  </Text>
                  <Text as="p" variant="body-sm" className="text-text-secondary">
                    {expiresAtLabel ? `Lenken er gyldig til ${expiresAtLabel}.` : 'Kontroller opplysningene under.'}
                  </Text>
                </div>
              </div>
              <KeyValueList
                items={[
                  { label: 'Dato', value: dateTime?.date ?? '—', icon: <Calendar className="size-4" /> },
                  { label: 'Tid', value: timeRange ?? dateTime?.time ?? '—', icon: <Clock className="size-4" /> },
                  { label: 'Varighet', value: durationMinutes ? `${durationMinutes} min` : '—' },
                  {
                    label: 'Pris',
                    value: totalPrice ? `${totalPrice} kr` : '—',
                    icon: <Sparkles className="size-4" />,
                  },
                ]}
              />
            </Card>
          ) : null}

          {error || actionError ? (
            <Notice variant="booking" tone="emphasis" title="Kunne ikke avbestille" message={actionError ?? error} />
          ) : null}

          {actionData?.success ? (
            <Notice variant="booking" title="Avbestillingen er registrert" message={actionData.message} />
          ) : null}

          {appointment ? (
            <Stack space="lg">
              <Panel title="Kontaktinformasjon">
                <KeyValueList
                  layout="stacked"
                  items={[
                    {
                      label: 'Navn',
                      value: `${contact?.givenName ?? ''} ${contact?.familyName ?? ''}`.trim() || '—',
                      icon: <User className="size-4" />,
                    },
                    ...(contact?.email
                      ? [{ label: 'E-post', value: contact.email, icon: <Mail className="size-4" /> }]
                      : []),
                    ...(contact?.mobileNumber
                      ? [{ label: 'Mobilnummer', value: contact.mobileNumber, icon: <Phone className="size-4" /> }]
                      : []),
                  ]}
                />
              </Panel>

              <Panel title="Tidspunkt">
                <KeyValueList
                  layout="stacked"
                  items={[
                    {
                      label: 'Dato',
                      value: dateTime?.date ?? appointment.startTime,
                      icon: <Calendar className="size-4" />,
                    },
                    {
                      label: 'Tid',
                      value: timeRange ?? dateTime?.time ?? appointment.startTime,
                      icon: <Clock className="size-4" />,
                    },
                    {
                      label: 'Varighet',
                      value: durationMinutes ? `${durationMinutes} min` : '—',
                      icon: <Clock className="size-4" />,
                    },
                  ]}
                />
              </Panel>

              <Panel title="Tjenester">
                {services.length ? (
                  <div className="divide-y divide-border">
                    {services.map((service) => (
                      <div key={service.id} className="flex items-center justify-between gap-3 py-3">
                        <span className="text-sm font-medium text-text-primary md:text-base">{service.name}</span>
                        <div className="flex shrink-0 items-center gap-3 text-xs text-text-secondary md:text-sm">
                          <span className="flex items-center gap-1">
                            <Clock className="size-3 md:size-3.5" />
                            {service.duration} min
                          </span>
                          <span className="flex items-center gap-1 font-semibold text-text-primary">
                            {service.price} kr
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <Text as="p" variant="body-sm" className="text-text-secondary">
                    Ingen tjenester funnet.
                  </Text>
                )}
              </Panel>
            </Stack>
          ) : (
            <Panel tone="muted">
              <Text as="p" variant="body-sm" className="text-text-secondary">
                Ingen avtale funnet.
              </Text>
            </Panel>
          )}
        </Stack>
      </Container>

      <ConfirmDialog
        title="Avbestill time"
        description="Er du sikker på at du vil avbestille timen? Avbestillingen kan ikke angres."
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        cancelAction={
          <Button type="button" variant="outline">
            Avbryt
          </Button>
        }
        confirmAction={
          <Form method="post" className="w-full sm:w-auto">
            <input type="hidden" name="token" value={cancelToken ?? ''} />
            <Button
              type="submit"
              variant="destructive"
              size="md"
              fullWidth
              loading={isSubmitting}
              disabled={!canCancel || isSubmitting}
            >
              Ja, avbestill
            </Button>
          </Form>
        }
      />
    </StickyFooterPageTemplate>
  );
}
