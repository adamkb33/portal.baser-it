import { data, redirect } from 'react-router';
import type { LoaderFunctionArgs } from 'react-router';
import { ROUTES_MAP } from '~/lib/route-tree';
import {
  buildEmbedModeCookieHeader,
  buildEmbedThemeCookieHeader,
  isEmbedThemeKey,
} from '~/lib/embed-shell';

const EMBED_START_STEP = 'contact';

function parseCompanyId(value: string | null): number | null {
  if (!value) return null;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
}

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const companyId = parseCompanyId(url.searchParams.get('companyId'));
  const start = url.searchParams.get('start');
  const themeParam = url.searchParams.get('theme');
  const reset = url.searchParams.get('reset') === '1';

  if (!companyId) {
    return data(
      {
        error: 'Mangler eller ugyldig companyId.',
      },
      { status: 400 },
    );
  }

  if (start && start !== EMBED_START_STEP) {
    return data(
      {
        error: `Ugyldig startverdi. Bruk start=${EMBED_START_STEP}.`,
      },
      { status: 400 },
    );
  }

  if (themeParam && !isEmbedThemeKey(themeParam)) {
    return data(
      {
        error: 'Ugyldig theme-verdi.',
      },
      { status: 400 },
    );
  }

  const sessionHref = ROUTES_MAP['booking.public.appointment.session'].href;
  const params = new URLSearchParams({ companyId: String(companyId) });
  const headers: [string, string][] = [];

  if (reset) {
    const { AppointmentSessionService } = await import('../booking/public/appointment/session/_services/appointment-session.service.server');
    const clearSessionCookie = await AppointmentSessionService.delete(request);
    headers.push(['Set-Cookie', clearSessionCookie]);
  }

  const embedModeCookieHeader = buildEmbedModeCookieHeader(request.url);
  const embedTheme = themeParam && isEmbedThemeKey(themeParam) ? themeParam : 'pitell';
  const embedThemeCookieHeader = buildEmbedThemeCookieHeader(request.url, embedTheme);
  headers.push(['Set-Cookie', embedModeCookieHeader], ['Set-Cookie', embedThemeCookieHeader]);

  return redirect(`${sessionHref}?${params.toString()}`, {
    headers,
  });
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
