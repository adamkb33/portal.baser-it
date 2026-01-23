import { data } from 'react-router';
import type { Route } from './+types/booking.public.appointment.cancel.route';
import { BookingContainer, BookingPageHeader, BookingSection } from '../_components/booking-layout';
import { decodeBase64Url } from '~/routes/auth/_utils/token-payload';

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

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const token = url.searchParams.get('token');

  if (!token) {
    return data(
      {
        token: null,
        decoded: null as DecodedToken | null,
        error: 'Token mangler i URL.',
      },
      { status: 400 },
    );
  }

  const { decoded, error } = decodeJwtLikeToken(token);
  return data({
    token,
    decoded,
    error: error ?? null,
  });
}

const renderJson = (value: unknown) => JSON.stringify(value ?? null, null, 2);

export default function BookingPublicAppointmentCancelRoute({ loaderData }: { loaderData?: CancelLoaderData }) {
  const token = loaderData?.token ?? null;
  const decoded = loaderData?.decoded ?? null;
  const error = loaderData?.error ?? null;

  return (
    <BookingContainer>
      <BookingPageHeader
        label="Avbestilling"
        title="Dekodet avbestillingstoken"
        description="Viser innholdet i tokenet som følger URL-en."
      />

      {error ? (
        <BookingSection title="Feil">
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        </BookingSection>
      ) : null}

      <BookingSection title="Token">
        <div className="rounded-lg border border-card-border bg-card px-4 py-3 text-xs text-muted-foreground break-all">
          {token ?? '—'}
        </div>
      </BookingSection>

      <BookingSection title="Header">
        <pre className="whitespace-pre-wrap rounded-lg border border-card-border bg-card px-4 py-3 text-xs text-muted-foreground">
          {renderJson(decoded?.header ?? decoded?.raw?.header ?? null)}
        </pre>
      </BookingSection>

      <BookingSection title="Payload">
        <pre className="whitespace-pre-wrap rounded-lg border border-card-border bg-card px-4 py-3 text-xs text-muted-foreground">
          {renderJson(decoded?.payload ?? decoded?.raw?.payload ?? null)}
        </pre>
      </BookingSection>

      <BookingSection title="Signatur">
        <div className="rounded-lg border border-card-border bg-card px-4 py-3 text-xs text-muted-foreground break-all">
          {decoded?.signature ?? '—'}
        </div>
      </BookingSection>
    </BookingContainer>
  );
}
