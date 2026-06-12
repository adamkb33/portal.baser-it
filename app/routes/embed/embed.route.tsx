import { data, redirect } from 'react-router';
import type { LoaderFunctionArgs } from 'react-router';
import { getBookingRouteHref } from '~/routes/_features/booking/_utils/booking.route-map';
import { resolveEmbedParentOrigin, resolveEmbedTheme, serializeEmbedConfig } from '~/lib/embed-config.server';
import { AppointmentSessionService } from '~/routes/_features/booking/_services/booking.appointment-session.service.server';

function parseCompanyId(value: string | null): number | null {
  if (!value) return null;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) return null;
  return parsed;
}

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const companyId = parseCompanyId(url.searchParams.get('companyId'));
  const theme = resolveEmbedTheme(url.searchParams.get('theme'));
  const parentOriginParam = url.searchParams.get('parentOrigin');
  const parentOrigin = resolveEmbedParentOrigin(parentOriginParam);
  const reset = url.searchParams.get('reset') === '1';

  if (!companyId) {
    return data({ error: 'Mangler eller ugyldig companyId.' }, { status: 400 });
  }

  if (!theme) {
    return data({ error: 'Ugyldig theme-verdi.' }, { status: 400 });
  }

  if (parentOriginParam && !parentOrigin) {
    return data({ error: 'Ugyldig parentOrigin-verdi.' }, { status: 400 });
  }

  const headers: [string, string][] = [];
  headers.push(['Set-Cookie', await serializeEmbedConfig({ theme, parentOrigin })]);

  if (reset) {
    const clearSessionCookie = await AppointmentSessionService.delete(request);
    headers.push(['Set-Cookie', clearSessionCookie]);
  }

  const sessionHref = getBookingRouteHref('embed', 'entry');
  const params = new URLSearchParams({ companyId: String(companyId) });

  return redirect(`${sessionHref}?${params.toString()}`, { headers });
}

export default function EmbedRoute({ loaderData }: { loaderData?: { error?: string } }) {
  const error = loaderData?.error;

  if (error) {
    return (
      <main className="mx-auto max-w-lg p-6">
        <h1 className="text-lg font-semibold">Kunne ikke starte booking</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error}</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-lg p-6">
      <p className="text-sm text-muted-foreground">Starter booking...</p>
    </main>
  );
}
