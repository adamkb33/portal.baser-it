import { data } from 'react-router';
import type { Route } from './+types/system-admin.smtp.diagnostics.route';
import { Base } from '~/api/generated/base';
import { withAuth } from '~/api/utils/with-auth';
import { resolveErrorPayload } from '~/lib/api-error';
import { ROUTES_MAP } from '~/lib/route-tree';
import { Button, CompanyPageTemplate, Notice, Panel, Text } from '~/ui';

export async function loader({ request }: Route.LoaderArgs) {
  try {
    const response = await withAuth(request, async () => Base.diagnostics());
    return data({ diagnostics: response.data?.data ?? null, error: null as string | null });
  } catch (error) {
    const { message, status } = resolveErrorPayload(error, 'Kunne ikke hente SMTP-diagnostikk.');
    return data({ diagnostics: null, error: message }, { status: status ?? 400 });
  }
}

export default function SystemAdminSmtpDiagnosticsPage({ loaderData }: Route.ComponentProps) {
  return (
    <CompanyPageTemplate
      title="SMTP diagnostikk"
      description="Viser status fra base-service/system-admin/smtp/diagnostics."
      routeLinks={
        <a href={ROUTES_MAP['system-admin.smtp'].href} className="inline-flex rounded-sm border border-border px-3 py-2 text-sm">
          Tilbake til SMTP
        </a>
      }
    >
      {loaderData.error ? <Notice tone="emphasis" title="Kunne ikke hente diagnostikk" message={loaderData.error} /> : null}
      <Panel title="Diagnostikk" description="Backend-respons">
        {loaderData.diagnostics ? (
          <div className="space-y-1">
            <Text as="p" variant="body-sm">Host: {loaderData.diagnostics.host ?? '—'}</Text>
            <Text as="p" variant="body-sm">Port: {String(loaderData.diagnostics.port ?? '—')}</Text>
            <Text as="p" variant="body-sm">SSL: {String(loaderData.diagnostics.ssl ?? '—')}</Text>
            <Text as="p" variant="body-sm">Auth enabled: {String(loaderData.diagnostics.authEnabled ?? '—')}</Text>
          </div>
        ) : (
          <Text as="p" variant="body-sm" className="text-text-secondary">
            Ingen diagnostikkdata tilgjengelig.
          </Text>
        )}
      </Panel>
      <form method="get" className="mt-3">
        <Button type="submit" variant="outline">Oppdater</Button>
      </form>
    </CompanyPageTemplate>
  );
}
