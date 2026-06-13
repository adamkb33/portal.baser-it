import { NavLink } from 'react-router';
import type { Route } from './+types/system-admin.smtp.route';
import { ROUTES_MAP } from '~/lib/routing/route-tree';
import { Button, CompanyPageTemplate, Panel } from '~/ui';

export async function loader() {
  return null;
}

export default function SystemAdminSmtpPage(_props: Route.ComponentProps) {
  return (
    <CompanyPageTemplate title="Systemadmin: SMTP" description="SMTP-verifisering og diagnostikk.">
      <Panel title="Diagnostikk" description="Kjør diagnose mot backend SMTP-oppsett.">
        <Button asChild variant="outline">
          <NavLink to={ROUTES_MAP['system-admin.smtp.diagnostics'].href}>Åpne SMTP-diagnostikk</NavLink>
        </Button>
      </Panel>
    </CompanyPageTemplate>
  );
}
