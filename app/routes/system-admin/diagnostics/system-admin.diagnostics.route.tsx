import { NavLink } from 'react-router';
import type { Route } from './+types/system-admin.diagnostics.route';
import { ROUTES_MAP } from '~/lib/routing/route-tree';
import { Card, CardContent, CardHeader, CardTitle, CompanyPageTemplate, Text } from '~/ui';

export async function loader() {
  return null;
}

export default function SystemAdminDiagnosticsPage(_props: Route.ComponentProps) {
  return (
    <CompanyPageTemplate title="Systemadmin: Diagnostikk" description="Diagnostikk per tjeneste og flyt.">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <NavLink
          to={ROUTES_MAP['system-admin.diagnostics.booking'].href}
          className="rounded-md border border-border bg-surface p-4 hover:bg-surface-secondary"
        >
          <Card variant="ghost" size="sm">
            <CardHeader>
              <CardTitle>Booking</CardTitle>
            </CardHeader>
            <CardContent>
              <Text as="p" variant="body-sm" className="text-text-secondary">
                Se tilgjengelige booking-flyter og detaljerte hendelser.
              </Text>
            </CardContent>
          </Card>
        </NavLink>
      </div>
    </CompanyPageTemplate>
  );
}
