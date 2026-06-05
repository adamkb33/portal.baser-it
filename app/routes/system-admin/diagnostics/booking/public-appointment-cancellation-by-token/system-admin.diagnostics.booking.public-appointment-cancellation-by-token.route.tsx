import { data, Form, NavLink } from 'react-router';
import type { Route } from './+types/system-admin.diagnostics.booking.public-appointment-cancellation-by-token.route';
import { Diagnostic } from '~/api/generated/diagnostic';
import { withAuth } from '~/api/utils/with-auth';
import { resolveErrorPayload } from '~/lib/api-error';
import { ROUTES_MAP } from '~/lib/routing/route-tree';
import { Button, CompanyPageTemplate, Notice, Panel, Text } from '~/ui';

function parseInteger(value: string | null): number | undefined {
  if (!value) return undefined;
  const parsed = Number(value);
  if (!Number.isInteger(parsed)) return undefined;
  return parsed;
}

function asDisplayValue(value: unknown): string {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const query = {
    from: url.searchParams.get('from') || undefined,
    to: url.searchParams.get('to') || undefined,
    sort: url.searchParams.get('sort') || undefined,
    eventType: (url.searchParams.get('eventType') as
      | 'PUBLIC_APPOINTMENT_CANCELLATION_BY_TOKEN_BLANK'
      | 'PUBLIC_APPOINTMENT_CANCELLATION_BY_TOKEN_MALFORMED'
      | 'PUBLIC_APPOINTMENT_CANCELLATION_BY_TOKEN_SIGNATURE_INVALID'
      | 'PUBLIC_APPOINTMENT_CANCELLATION_BY_TOKEN_PAYLOAD_INVALID'
      | 'PUBLIC_APPOINTMENT_CANCELLATION_BY_TOKEN_EXPIRED'
      | 'PUBLIC_APPOINTMENT_CANCELLATION_BY_TOKEN_APPOINTMENT_NOT_FOUND'
      | 'PUBLIC_APPOINTMENT_CANCELLATION_BY_TOKEN_PROFILE_NOT_FOUND'
      | 'PUBLIC_APPOINTMENT_CANCELLATION_BY_TOKEN_PROVIDER_LOOKUP_FAILED'
      | 'PUBLIC_APPOINTMENT_CANCELLATION_BY_TOKEN_NOTIFICATION_FAILED'
      | 'PUBLIC_APPOINTMENT_CANCELLATION_BY_TOKEN_FAILED'
      | null) ?? undefined,
    tokenHash: url.searchParams.get('tokenHash') || undefined,
    companyId: parseInteger(url.searchParams.get('companyId')),
    appointmentId: parseInteger(url.searchParams.get('appointmentId')),
    page: parseInteger(url.searchParams.get('page')),
    size: parseInteger(url.searchParams.get('size')),
  };

  try {
    const response = await withAuth(request, () =>
      Diagnostic.publicAppointmentCancellationByToken({
        query,
      }),
    );
    return data({
      tableData: response.data?.data ?? null,
      query,
      error: null as string | null,
    });
  } catch (error) {
    const { message, status } = resolveErrorPayload(error, 'Kunne ikke hente diagnostikk-tabell.');
    return data(
      {
        tableData: null,
        query,
        error: message,
      },
      { status: status ?? 400 },
    );
  }
}

export default function SystemAdminDiagnosticsBookingPublicAppointmentCancellationByTokenPage({
  loaderData,
}: Route.ComponentProps) {
  const tableData = loaderData.tableData;

  return (
    <CompanyPageTemplate
      title="Booking diagnostikk: Public appointment cancellation by token"
      description="Detaljert hendelsestabell med backend-definerte felt og filtre."
      routeLinks={
        <NavLink to={ROUTES_MAP['system-admin.diagnostics.booking'].href} className="inline-flex rounded-sm border border-border px-3 py-2 text-sm">
          Tilbake til booking-diagnostikk
        </NavLink>
      }
    >
      {loaderData.error ? (
        <Notice tone="emphasis" title="Kunne ikke hente tabell" message={loaderData.error} />
      ) : null}

      <Panel title="Filtre" description="Server-side filtre">
        <Form method="get" className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <label className="space-y-1">
            <Text as="span" variant="caption" className="text-text-secondary">
              From
            </Text>
            <input name="from" defaultValue={loaderData.query.from ?? ''} className="w-full rounded-sm border border-border bg-background px-3 py-2 text-sm" />
          </label>
          <label className="space-y-1">
            <Text as="span" variant="caption" className="text-text-secondary">
              To
            </Text>
            <input name="to" defaultValue={loaderData.query.to ?? ''} className="w-full rounded-sm border border-border bg-background px-3 py-2 text-sm" />
          </label>
          <label className="space-y-1">
            <Text as="span" variant="caption" className="text-text-secondary">
              Event type
            </Text>
            <input name="eventType" defaultValue={loaderData.query.eventType ?? ''} className="w-full rounded-sm border border-border bg-background px-3 py-2 text-sm" />
          </label>
          <label className="space-y-1">
            <Text as="span" variant="caption" className="text-text-secondary">
              Company ID
            </Text>
            <input name="companyId" defaultValue={loaderData.query.companyId ?? ''} className="w-full rounded-sm border border-border bg-background px-3 py-2 text-sm" />
          </label>
          <label className="space-y-1">
            <Text as="span" variant="caption" className="text-text-secondary">
              Appointment ID
            </Text>
            <input name="appointmentId" defaultValue={loaderData.query.appointmentId ?? ''} className="w-full rounded-sm border border-border bg-background px-3 py-2 text-sm" />
          </label>
          <label className="space-y-1">
            <Text as="span" variant="caption" className="text-text-secondary">
              Token hash
            </Text>
            <input name="tokenHash" defaultValue={loaderData.query.tokenHash ?? ''} className="w-full rounded-sm border border-border bg-background px-3 py-2 text-sm" />
          </label>
          <div className="md:col-span-3 flex gap-2">
            <Button type="submit" variant="outline">
              Oppdater
            </Button>
            <NavLink to={ROUTES_MAP['system-admin.diagnostics.booking.public-appointment-cancellation-by-token'].href} className="inline-flex items-center justify-center rounded-sm border border-border px-3 py-2 text-sm">
              Nullstill
            </NavLink>
          </div>
        </Form>
      </Panel>

      <Panel title={tableData?.table?.title ?? 'Diagnostikk-tabell'} description={tableData?.table?.description ?? undefined}>
        {tableData?.fields?.length ? (
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse">
              <thead>
                <tr className="border-b border-border">
                  {tableData.fields.map((field) => (
                    <th key={field.key} className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wide text-text-secondary">
                      {field.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableData.rows.map((row) => {
                  const byKey = new Map(row.values.map((value) => [value.key, value]));
                  return (
                    <tr key={row.id} className="border-b border-border/60">
                      {tableData.fields.map((field) => {
                        const cell = byKey.get(field.key);
                        return (
                          <td key={`${row.id}:${field.key}`} className="px-3 py-2 text-sm text-text-primary">
                            {cell?.displayValue ?? asDisplayValue(cell?.value)}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <Text as="p" variant="body-sm" className="text-text-secondary">
            {tableData?.table?.emptyState ?? 'Ingen data tilgjengelig.'}
          </Text>
        )}

        {tableData?.pagination ? (
          <div className="mt-3 flex items-center justify-between gap-3">
            <Text as="p" variant="caption" className="text-text-secondary">
              Side {tableData.pagination.page + 1} av {tableData.pagination.totalPages}
            </Text>
          </div>
        ) : null}
      </Panel>
    </CompanyPageTemplate>
  );
}
