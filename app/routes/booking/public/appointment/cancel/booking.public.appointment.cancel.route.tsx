import { data, Form, useActionData, useNavigation } from 'react-router';
import type { Route } from './+types/booking.public.appointment.cancel.route';
import { BookingContainer, BookingPageHeader, BookingSection } from '../_components/booking-layout';
import { decodeBase64Url } from '~/routes/auth/_utils/token-payload';
import { PublicAppointmentSessionController, type AppointmentDto } from '~/api/generated/booking';
import { resolveErrorPayload } from '~/lib/api-error';
import { BookingButton } from '../_components/booking-layout';

type DecodedToken = {
  header: Record<string, unknown> | null;
  payload: Record<string, unknown> | null;
  signature: string | null;
  raw: {
    header: string | null;
    payload: string | null;
  };
};

type CancelLoaderData = {
  token: string | null;
  decoded: DecodedToken | null;
  error: string | null;
  appointment: AppointmentDto | null;
  appointmentId: number | null;
  expiresAt: number | null;
};

type CancelActionData = { success: true; message: string } | { success: false; error: string };

type CancelTokenPayload = {
  appointmentId?: number;
  expiresAt?: number;
};

const decodeJwtLikeToken = (token: string): { decoded: DecodedToken | null; error?: string } => {
  const parts = token.split('.');
  if (parts.length !== 3) {
    return { decoded: null, error: 'Token må ha tre deler (header.payload.signature).' };
  }

  const [rawHeader, rawPayload, signature] = parts;

  const headerText = decodeBase64Url(rawHeader);
  const payloadText = decodeBase64Url(rawPayload);

  if (!headerText || !payloadText) {
    return { decoded: null, error: 'Kunne ikke dekode token.' };
  }

  let header: Record<string, unknown> | null = null;
  let payload: Record<string, unknown> | null = null;

  try {
    header = headerText ? (JSON.parse(headerText) as Record<string, unknown>) : null;
  } catch {
    header = null;
  }

  try {
    payload = payloadText ? (JSON.parse(payloadText) as Record<string, unknown>) : null;
  } catch {
    payload = null;
  }

  return {
    decoded: {
      header,
      payload,
      signature: signature || null,
      raw: {
        header: headerText || null,
        payload: payloadText || null,
      },
    },
  };
};

const toNumberOrNull = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const token = url.searchParams.get('token');

  if (!token) {
    return data(
      {
        token: null,
        decoded: null as DecodedToken | null,
        error: 'Token mangler i URL.',
        appointment: null,
        appointmentId: null,
        expiresAt: null,
      },
      { status: 400 },
    );
  }

  const { decoded, error } = decodeJwtLikeToken(token);
  if (!decoded || error) {
    return data(
      {
        token,
        decoded,
        error: error ?? 'Kunne ikke dekode token.',
        appointment: null,
        appointmentId: null,
        expiresAt: null,
      },
      { status: 400 },
    );
  }

  const payload = decoded.payload as CancelTokenPayload | null;
  const appointmentId = toNumberOrNull(payload?.appointmentId);
  const expiresAt = toNumberOrNull(payload?.expiresAt);

  if (!appointmentId) {
    return data(
      {
        token,
        decoded,
        error: 'Tokenet mangler appointmentId.',
        appointment: null,
        appointmentId: null,
        expiresAt,
      },
      { status: 400 },
    );
  }

  if (expiresAt && expiresAt * 1000 < Date.now()) {
    return data(
      {
        token,
        decoded,
        error: 'Tokenet har utløpt.',
        appointment: null,
        appointmentId,
        expiresAt,
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
          token,
          decoded,
          error: 'Kunne ikke finne avtalen.',
          appointment: null,
          appointmentId,
          expiresAt,
        },
        { status: 404 },
      );
    }

    return data({
      token,
      decoded,
      error: null,
      appointment,
      appointmentId,
      expiresAt,
    });
  } catch (err) {
    const { message, status } = resolveErrorPayload(err, 'Kunne ikke hente avtalen.');
    return data(
      {
        token,
        decoded,
        error: message,
        appointment: null,
        appointmentId,
        expiresAt,
      },
      { status: status ?? 400 },
    );
  }
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const appointmentId = String(formData.get('appointmentId') ?? '');

  if (!appointmentId) {
    return data<CancelActionData>(
      {
        success: false,
        error: 'Appointment-ID mangler.',
      },
      { status: 400 },
    );
  }

  return data<CancelActionData>({
    success: true,
    message: 'Avbestilling er ikke koblet til backend ennå.',
  });
}

const formatDateTime = (value?: string | null) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('nb-NO', {
    dateStyle: 'full',
    timeStyle: 'short',
  }).format(date);
};

export default function BookingPublicAppointmentCancelRoute({ loaderData }: { loaderData?: CancelLoaderData }) {
  const token = loaderData?.token ?? null;
  const error = loaderData?.error ?? null;
  const appointment = loaderData?.appointment ?? null;
  const appointmentId = loaderData?.appointmentId ?? null;
  const actionData = useActionData<CancelActionData>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';
  const canCancel = Boolean(appointmentId && appointment && !error);

  const startTime = formatDateTime(appointment?.startTime);
  const endTime = formatDateTime(appointment?.endTime);

  return (
    <BookingContainer>
      <BookingPageHeader
        label="Avbestilling"
        title="Avbestill time"
        description="Se detaljer om avtalen og avbestill om ønskelig."
      />

      {error || actionData?.success === false ? (
        <BookingSection title="Feil">
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {actionData?.success === false ? actionData.error : error}
          </div>
        </BookingSection>
      ) : null}

      {actionData?.success ? (
        <BookingSection title="Status">
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {actionData.message}
          </div>
        </BookingSection>
      ) : null}

      <BookingSection title="Avtale">
        {appointment ? (
          <div className="space-y-3 rounded-lg border border-card-border bg-card px-4 py-3 text-sm text-muted-foreground">
            <div>
              <span className="font-semibold text-card-text">Tidspunkt:</span> {startTime ?? appointment.startTime}
              {endTime ? ` – ${endTime}` : null}
            </div>
            <div>
              <span className="font-semibold text-card-text">Kontakt:</span> {appointment.contact?.givenName}{' '}
              {appointment.contact?.familyName}
            </div>
            <div>
              <span className="font-semibold text-card-text">E-post:</span> {appointment.contact?.email?.value ?? '—'}
            </div>
            <div>
              <span className="font-semibold text-card-text">Telefon:</span>{' '}
              {appointment.contact?.mobileNumber?.value ?? '—'}
            </div>
            <div>
              <span className="font-semibold text-card-text">Tjenester:</span>{' '}
              {appointment.groupedServiceGroups
                .flatMap((group) => group.services.map((service) => service.name))
                .filter(Boolean)
                .join(', ') || '—'}
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-card-border bg-card px-4 py-3 text-sm text-muted-foreground">
            Ingen avtale funnet.
          </div>
        )}
      </BookingSection>

      <BookingSection title="Avbestill time">
        <Form method="post" className="space-y-3">
          <input type="hidden" name="appointmentId" value={appointmentId ?? ''} />
          <input type="hidden" name="token" value={token ?? ''} />
          <BookingButton
            type="submit"
            variant="destructive"
            size="lg"
            fullWidth
            loading={isSubmitting}
            disabled={!canCancel || isSubmitting}
          >
            Slett avtale
          </BookingButton>
        </Form>
      </BookingSection>
    </BookingContainer>
  );
}
