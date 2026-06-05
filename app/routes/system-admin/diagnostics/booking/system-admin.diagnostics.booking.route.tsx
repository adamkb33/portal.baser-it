import { data, NavLink } from 'react-router';
import type { Route } from './+types/system-admin.diagnostics.booking.route';
import { Diagnostic } from '~/api/generated/diagnostic';
import { withAuth } from '~/api/utils/with-auth';
import { resolveErrorPayload } from '~/lib/api-error';
import { ROUTES_MAP } from '~/lib/routing/route-tree';
import { CompanyPageTemplate, Notice, Panel, Text } from '~/ui';

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const from = url.searchParams.get('from') || undefined;
  const to = url.searchParams.get('to') || undefined;

  try {
    const response = await withAuth(request, () =>
      Diagnostic.flows({
        query: {
          from,
          to,
        },
      }),
    );
    return data({ flowsData: response.data?.data ?? null, error: null as string | null });
  } catch (error) {
    const { message, status } = resolveErrorPayload(error, 'Kunne ikke hente booking-diagnostikk.');
    return data({ flowsData: null, error: message }, { status: status ?? 400 });
  }
}

export default function SystemAdminDiagnosticsBookingPage({ loaderData }: Route.ComponentProps) {
  const flowLinkById: Record<string, string> = {
    PUBLIC_APPOINTMENT_CANCELLATION_BY_TOKEN:
      ROUTES_MAP['system-admin.diagnostics.booking.public-appointment-cancellation-by-token'].href,
  };

  return (
    <CompanyPageTemplate
      title="Diagnostikk: Booking"
      description="Tilgjengelige diagnostikk-flyter for booking."
      routeLinks={
        <NavLink to={ROUTES_MAP['system-admin.diagnostics'].href} className="inline-flex rounded-sm border border-border px-3 py-2 text-sm">
          Tilbake til diagnostikk
        </NavLink>
      }
    >
      {loaderData.error ? <Notice tone="emphasis" title="Kunne ikke hente booking-flyter" message={loaderData.error} /> : null}

      <Panel title="Flyter" description="Status per diagnostikkflyt.">
        {loaderData.flowsData?.flows?.length ? (
          <div className="space-y-2">
            {loaderData.flowsData.flows.map((flow) => {
              const href = flowLinkById[flow.id];
              const content = (
                <div className="space-y-1">
                  <Text as="p" variant="body-sm" className="font-semibold">
                    {flow.title}
                  </Text>
                  <Text as="p" variant="caption" className="text-text-secondary">
                    Status: {flow.status} · Severity: {flow.severity} · Errors: {flow.totalCount}
                  </Text>
                  <Text as="p" variant="caption" className="text-text-secondary">
                    Siste feil: {flow.lastOccurredAt ?? '—'}
                  </Text>
                </div>
              );

              if (!href) {
                return (
                  <div key={flow.id} className="rounded-md border border-border bg-background p-3">
                    {content}
                  </div>
                );
              }

              return (
                <NavLink key={flow.id} to={href} className="block rounded-md border border-border bg-background p-3 hover:bg-surface">
                  {content}
                </NavLink>
              );
            })}
          </div>
        ) : (
          <Text as="p" variant="body-sm" className="text-text-secondary">
            Ingen flyter tilgjengelig.
          </Text>
        )}
      </Panel>
    </CompanyPageTemplate>
  );
}
