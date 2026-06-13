import { data, Form, useNavigation } from 'react-router';
import type { Route } from './+types/booking.public.appointment.cancel-by-id.route';
import { AppointmentsController, PublicAppointmentSessionController } from '~/api/generated/booking';
import type { AppointmentDto } from '~/api/generated/booking';
import { withAuth } from '~/api/utils/with-auth';
import { resolveErrorPayload } from '~/lib/api-error';
import { authService } from '~/lib/auth-service';
import { ROUTES_MAP } from '~/lib/routing/route-tree';
import { redirectWithError, redirectWithInfo } from '~/lib/flash-message.server';
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
import { Calendar, Clock, DollarSign, Mail, Sparkles, User, XCircle } from 'lucide-react';
import { useState } from 'react';

function parseAppointmentId(value: string | undefined): number | null {
  if (!value) return null;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) return null;
  return parsed;
}

function formatDateTime(value: string) {
  const date = new Date(value);
  const dateText = new Intl.DateTimeFormat('nb-NO', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(date);
  const timeText = new Intl.DateTimeFormat('nb-NO', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
  return { dateText, timeText };
}

function formatDateTimeFull(value: string) {
  const date = new Date(value);
  return new Intl.DateTimeFormat('nb-NO', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

function getDurationMinutes(startIso: string, endIso: string): number {
  const start = new Date(startIso).getTime();
  const end = new Date(endIso).getTime();
  return Math.max(0, Math.round((end - start) / 60000));
}

async function loadOwnedAppointment(request: Request, appointmentId: number) {
  const auth = await authService.getAuth(request);
  if (!auth) {
    throw await redirectWithError(request, ROUTES_MAP['auth.sign-in'].href, 'Du må logge inn for å avbestille time.');
  }

  const response = await withAuth(request, async () => {
    return PublicAppointmentSessionController.getAppointmentById({
      query: { appointmentId },
    });
  });
  const appointment = response.data?.data;

  if (!appointment) {
    throw await redirectWithError(request, ROUTES_MAP['booking.public.my-appointments'].href, 'Fant ikke avtalen.');
  }

  if (appointment.userId !== auth.id) {
    throw await redirectWithError(
      request,
      ROUTES_MAP['booking.public.my-appointments'].href,
      'Du kan bare avbestille egne avtaler.',
    );
  }

  return appointment;
}

export async function loader({ request, params }: Route.LoaderArgs) {
  const appointmentId = parseAppointmentId(params.appointmentId);
  if (!appointmentId) {
    return redirectWithError(request, ROUTES_MAP['booking.public.my-appointments'].href, 'Ugyldig avtale-ID.');
  }

  try {
    const appointment = await loadOwnedAppointment(request, appointmentId);
    const totalPrice = appointment.groupedServiceGroups.reduce(
      (sum, group) => sum + group.services.reduce((inner, service) => inner + service.price, 0),
      0,
    );
    const duration = getDurationMinutes(appointment.startTime, appointment.endTime);
    const startsAt = new Date(appointment.startTime).getTime();

    return data({
      appointment,
      canCancel: startsAt > Date.now(),
      duration,
      totalPrice,
      error: null as string | null,
    });
  } catch (error) {
    if (error instanceof Response) throw error;
    const { message, status } = resolveErrorPayload(error, 'Kunne ikke hente avtalen.');
    return data(
      {
        appointment: null,
        canCancel: false,
        duration: 0,
        totalPrice: 0,
        error: message,
      },
      { status: status ?? 400 },
    );
  }
}

export async function action({ request, params }: Route.ActionArgs) {
  const appointmentId = parseAppointmentId(params.appointmentId);
  if (!appointmentId) {
    return redirectWithError(request, ROUTES_MAP['booking.public.my-appointments'].href, 'Ugyldig avtale-ID.');
  }

  try {
    await loadOwnedAppointment(request, appointmentId);

    await withAuth(request, async () => {
      return AppointmentsController.cancelMyAppointment({
        path: { appointmentId },
      });
    });

    return redirectWithInfo(
      request,
      ROUTES_MAP['booking.public.my-appointments'].href,
      'Avbestillingen er registrert.',
    );
  } catch (error) {
    if (error instanceof Response) throw error;
    const { message } = resolveErrorPayload(error, 'Kunne ikke avbestille avtalen.');
    return redirectWithError(request, ROUTES_MAP['booking.public.my-appointments'].href, message);
  }
}

export default function BookingPublicAppointmentCancelByIdRoute({ loaderData }: Route.ComponentProps) {
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  if (loaderData.error || !loaderData.appointment) {
    return (
      <Container size="lg">
        <PageHeader
          label="Avbestilling"
          title="Avbestill time"
          description={loaderData.error ?? 'Kunne ikke hente avtalen.'}
        />
        <Notice
          variant="booking"
          tone="emphasis"
          title="Kunne ikke hente avtalen"
          message={loaderData.error ?? 'Vi fant ikke en gyldig avtale for avbestilling.'}
        />
      </Container>
    );
  }

  const appointment = loaderData.appointment;
  const starts = formatDateTime(appointment.startTime);
  const startsFull = formatDateTimeFull(appointment.startTime);
  const services = appointment.groupedServiceGroups.flatMap((group) => group.services);
  const canCancel = loaderData.canCancel === true;

  return (
    <StickyFooterPageTemplate
      footer={
        <StickySummaryBar
          title="Avbestill"
          items={[
            { label: 'Dato', value: startsFull },
            {
              label: 'Kontaktinformasjon',
              value: `${appointment.user.givenName} ${appointment.user.familyName}`.trim() || '—',
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
      }
    >
      <Container size="lg">
        <Stack space="xl">
          <PageHeader
            label="Avbestilling"
            title="Avbestill time"
            description={
              canCancel
                ? 'Kontroller opplysningene under før du avbestiller.'
                : 'Avtalen har allerede startet og kan ikke avbestilles her.'
            }
          />

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
                  Avtale #{appointment.id}
                </Text>
              </div>
            </div>
            <KeyValueList
              items={[
                { label: 'Dato', value: starts.dateText, icon: <Calendar className="size-4" /> },
                { label: 'Tid', value: `kl. ${starts.timeText}`, icon: <Clock className="size-4" /> },
                { label: 'Varighet', value: `${loaderData.duration} min`, icon: <Clock className="size-4" /> },
                { label: 'Pris', value: `${loaderData.totalPrice} kr`, icon: <Sparkles className="size-4" /> },
              ]}
            />
          </Card>

          {!canCancel ? (
            <Notice
              variant="booking"
              tone="muted"
              title="Avbestilling ikke tilgjengelig"
              message="Denne avtalen kan ikke avbestilles fordi tidspunktet allerede har startet."
            />
          ) : null}

          <Stack space="lg">
            <Panel title="Kontaktinformasjon">
              <KeyValueList
                layout="stacked"
                items={[
                  {
                    label: 'Navn',
                    value: `${appointment.user.givenName} ${appointment.user.familyName}`.trim() || '—',
                    icon: <User className="size-4" />,
                  },
                  ...(appointment.user.email
                    ? [{ label: 'E-post', value: appointment.user.email, icon: <Mail className="size-4" /> }]
                    : []),
                ]}
              />
            </Panel>

            <Panel title="Tidspunkt">
              <KeyValueList
                layout="stacked"
                items={[
                  { label: 'Dato', value: starts.dateText, icon: <Calendar className="size-4" /> },
                  { label: 'Tid', value: `kl. ${starts.timeText}`, icon: <Clock className="size-4" /> },
                  { label: 'Varighet', value: `${loaderData.duration} min`, icon: <Clock className="size-4" /> },
                  { label: 'Pris', value: `${loaderData.totalPrice} kr`, icon: <DollarSign className="size-4" /> },
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
