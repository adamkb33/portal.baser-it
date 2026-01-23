import { data, Form, useActionData, useNavigation, useLoaderData } from 'react-router';
import { useState } from 'react';
import type { Route } from './+types/booking.public.appointment.cancel.route';
import {
  BookingContainer,
  BookingSummary,
  BookingStepHeader,
  CollapsibleCard,
  BookingMeta,
  BookingButton,
} from '../_components/booking-layout';
import { BookingDeleteModal } from '../_components/booking-delete-modal';
import { PublicAppointmentSessionController } from '~/api/generated/booking';
import { resolveErrorPayload } from '~/lib/api-error';
import { redirectWithInfo } from '~/routes/company/_lib/flash-message.server';
import { Calendar, Clock, User, Mail, Phone, Sparkles, XCircle } from 'lucide-react';
import { decodeCancelAppointmentToken } from '~/routes/booking/public/_utils/cancel-appointment-token';

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

  const { appointmentId, expiresAt, token } = claims;
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
        appointmentId,
        expiresAt,
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
  const totalDuration = services.reduce((sum, service) => sum + service.duration, 0);
  const totalPrice = services.reduce((sum, service) => sum + service.price, 0);
  const durationMinutes = totalDuration || getDurationMinutes(appointment?.startTime, appointment?.endTime);
  const actionError = actionData?.success === false ? actionData.error : null;

  if (error && !appointment) {
    return (
      <BookingContainer>
        <BookingStepHeader label="Avbestilling" title="Avbestill time" description={error} />
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      </BookingContainer>
    );
  }

  return (
    <>
      <BookingContainer>
        {appointment && !error ? (
          <div className="relative overflow-hidden rounded-lg border-2 border-destructive/20 bg-gradient-to-br from-destructive/10 via-destructive/5 to-transparent p-4 shadow-sm md:p-6">
            <div className="absolute right-0 top-0 size-32 translate-x-8 -translate-y-8 rounded-full bg-destructive/10 blur-3xl" />
            <div className="relative space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex size-12 items-center justify-center rounded-full bg-destructive/15 text-destructive shadow-sm">
                  <XCircle className="size-6" strokeWidth={2.5} />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground md:text-sm">
                    Avbestillingsforespørsel
                  </p>
                  <p className="text-sm text-muted-foreground md:text-base">
                    {expiresAtLabel ? `Lenken er gyldig til ${expiresAtLabel}.` : 'Kontroller opplysningene under.'}
                  </p>
                </div>
              </div>

              <div className="space-y-2 rounded-lg bg-background/50 p-4 backdrop-blur-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="size-5 text-destructive/80 md:size-6" />
                  <div>
                    <p className="text-xs font-medium text-muted-foreground md:text-sm">{dateTime?.dayName ?? '—'}</p>
                    <p className="text-lg font-bold text-card-text md:text-xl">{dateTime?.date ?? '—'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 border-t border-card-border pt-2">
                  <Clock className="size-5 text-destructive/80 md:size-6" />
                  <div className="flex flex-1 items-baseline justify-between gap-3">
                    <p className="text-lg font-bold text-card-text md:text-xl">{timeRange ?? dateTime?.time ?? '—'}</p>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-muted-foreground">
                        {durationMinutes ? `${durationMinutes} min` : '—'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 rounded-md bg-destructive/15 px-3 py-2 text-destructive">
                <div className="flex items-center gap-2">
                  <Sparkles className="size-5 md:size-6" strokeWidth={2.5} />
                  <span className="text-xs font-medium md:text-sm">Estimert total pris</span>
                </div>
                <p className="text-lg font-bold md:text-2xl">{totalPrice ? `${totalPrice} kr` : '—'}</p>
              </div>
            </div>
          </div>
        ) : null}

        {error || actionError ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {actionError ?? error}
          </div>
        ) : null}

        {actionData?.success ? (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {actionData.message}
          </div>
        ) : null}

        {appointment ? (
          <>
            <CollapsibleCard
              title="Kontaktinformasjon"
              icon={<User className="size-5 text-destructive" />}
              defaultOpen={false}
            >
              <BookingMeta
                layout="stacked"
                items={[
                  {
                    label: 'Navn',
                    value:
                      `${appointment.contact?.givenName ?? ''} ${appointment.contact?.familyName ?? ''}`.trim() || '—',
                    icon: <User className="size-4 text-muted-foreground" />,
                  },
                  ...(appointment.contact?.email?.value
                    ? [
                        {
                          label: 'E-post',
                          value: appointment.contact.email.value,
                          icon: <Mail className="size-4 text-muted-foreground" />,
                        },
                      ]
                    : []),
                  ...(appointment.contact?.mobileNumber?.value
                    ? [
                        {
                          label: 'Mobilnummer',
                          value: appointment.contact.mobileNumber.value,
                          icon: <Phone className="size-4 text-muted-foreground" />,
                        },
                      ]
                    : []),
                ]}
              />
            </CollapsibleCard>

            <CollapsibleCard title="Tidspunkt" icon={<Calendar className="size-5 text-destructive" />}>
              <BookingMeta
                layout="stacked"
                items={[
                  {
                    label: 'Dato',
                    value: dateTime?.date ?? appointment.startTime,
                    icon: <Calendar className="size-4 text-muted-foreground" />,
                  },
                  {
                    label: 'Tid',
                    value: timeRange ?? dateTime?.time ?? appointment.startTime,
                    icon: <Clock className="size-4 text-muted-foreground" />,
                  },
                  {
                    label: 'Varighet',
                    value: durationMinutes ? `${durationMinutes} min` : '—',
                    icon: <Clock className="size-4 text-muted-foreground" />,
                  },
                ]}
              />
            </CollapsibleCard>

            <CollapsibleCard
              title="Tjenester"
              icon={<Sparkles className="size-5 text-destructive" />}
              badge={
                <span className="rounded-full bg-destructive px-2.5 py-0.5 text-xs font-semibold text-destructive-foreground">
                  {services.length}
                </span>
              }
            >
              {services.length ? (
                <div className="space-y-2">
                  {services.map((service) => (
                    <div
                      key={service.id}
                      className="flex items-center justify-between gap-3 rounded-lg border border-card-border bg-card-accent/5 p-3"
                    >
                      <span className="text-sm font-medium text-card-text md:text-base">{service.name}</span>
                      <div className="flex shrink-0 items-center gap-3 text-xs text-muted-foreground md:text-sm">
                        <span className="flex items-center gap-1">
                          <Clock className="size-3 md:size-3.5" />
                          {service.duration} min
                        </span>
                        <span className="flex items-center gap-1 font-semibold text-card-text">{service.price} kr</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Ingen tjenester funnet.</p>
              )}
            </CollapsibleCard>
          </>
        ) : (
          <div className="rounded-lg border border-card-border bg-card px-4 py-3 text-sm text-muted-foreground">
            Ingen avtale funnet.
          </div>
        )}
      </BookingContainer>
      {appointment ? (
        <BookingSummary
          mobile={{
            title: 'Avbestill',
            items: [
              { label: 'Dato', value: dateTime?.full ?? appointment?.startTime },
              {
                label: 'Kontaktinformasjon',
                value:
                  `${appointment?.contact?.givenName ?? ''} ${appointment?.contact?.familyName ?? ''}`.trim() || '—',
              },
            ],
            primaryAction: (
              <BookingButton
                type="button"
                variant="destructive"
                size="lg"
                fullWidth
                disabled={!canCancel || isSubmitting}
                onClick={() => setIsDeleteOpen(true)}
              >
                Avbestill
              </BookingButton>
            ),
            primaryActionClassName: 'w-full',
            className: 'border-t border-destructive/20 bg-destructive/5',
          }}
          desktopClassName="sticky bottom-4 rounded-lg border-2 border-destructive/30 bg-destructive/10 p-4 text-foreground shadow-xl"
        />
      ) : null}

      <BookingDeleteModal
        title="Avbestill time"
        description="Er du sikker på at du vil avbestille timen? Avbestillingen kan ikke angres."
        cancelLabel="Avbryt"
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        confirmAction={
          <Form method="post" className="w-full sm:w-auto">
            <input type="hidden" name="token" value={cancelToken ?? ''} />
            <BookingButton
              type="submit"
              variant="destructive"
              size="md"
              fullWidth
              loading={isSubmitting}
              disabled={!canCancel || isSubmitting}
            >
              Ja, avbestill
            </BookingButton>
          </Form>
        }
      />
    </>
  );
}
